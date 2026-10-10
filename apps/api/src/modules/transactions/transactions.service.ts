import { Prisma, Transaction, TransactionStatus } from "@prisma/client";
import {
  TransactionsRepository,
  transactionsRepository,
} from "./transactions.repository.js";
import {
  CreateTransactionInput,
  ListTransactionsQuery,
} from "./transactions.schemas.js";
import { generateTransactionId } from "../../shared/transaction-id.js";
import { AppError } from "../../shared/app-error.js";

export { TransactionStatus };

export interface TransactionDto {
  id: string;
  transactionId: string;
  amount: string;
  currency: string;
  description: string;
  status: TransactionStatus;
  failureReason: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTransactions {
  items: TransactionDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function toTransactionDto(tx: Transaction): TransactionDto {
  return {
    id: tx.id,
    transactionId: tx.transactionId,
    amount: tx.amount.toFixed(2),
    currency: tx.currency,
    description: tx.description,
    status: tx.status,
    failureReason: tx.failureReason,
    processedAt: tx.processedAt ? tx.processedAt.toISOString() : null,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  };
}

export class TransactionsService {
  constructor(
    private repo: TransactionsRepository = transactionsRepository
  ) {}

  async createTransaction(
    userId: string,
    idempotencyKey: string,
    input: CreateTransactionInput
  ): Promise<{ transaction: TransactionDto; created: boolean }> {
    const existing = await this.repo.findByIdempotencyKey(
      userId,
      idempotencyKey
    );

    if (existing) {
      this.assertIdempotencyMatch(existing, input);
      return {
        transaction: toTransactionDto(existing),
        created: false,
      };
    }

    const transactionId = generateTransactionId();
    const decimalAmount = new Prisma.Decimal(input.amount);

    try {
      const created = await this.repo.create({
        transactionId,
        userId,
        idempotencyKey,
        amount: decimalAmount,
        currency: input.currency,
        description: input.description,
      });

      return {
        transaction: toTransactionDto(created),
        created: true,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const winner = await this.repo.findByIdempotencyKey(
          userId,
          idempotencyKey
        );
        if (winner) {
          this.assertIdempotencyMatch(winner, input);
          return {
            transaction: toTransactionDto(winner),
            created: false,
          };
        }
      }
      throw error;
    }
  }

  async listTransactions(
    userId: string,
    query: ListTransactionsQuery
  ): Promise<PaginatedTransactions> {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [items, total] = await this.repo.findManyByUserId(userId, {
      skip,
      take: limit,
      status: query.status,
    });

    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    return {
      items: items.map(toTransactionDto),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getTransaction(
    userId: string,
    id: string
  ): Promise<TransactionDto> {
    const tx = await this.repo.findOwnedTransaction(userId, id);

    if (!tx) {
      throw new AppError("NOT_FOUND", "Transaction not found", 404);
    }

    return toTransactionDto(tx);
  }

  private assertIdempotencyMatch(
    existing: Transaction,
    input: CreateTransactionInput
  ): void {
    const inputDecimal = new Prisma.Decimal(input.amount);
    const amountMatches = existing.amount.equals(inputDecimal);
    const currencyMatches = existing.currency === input.currency;
    const descriptionMatches = existing.description === input.description;

    if (!amountMatches || !currencyMatches || !descriptionMatches) {
      throw new AppError(
        "IDEMPOTENCY_CONFLICT",
        "An idempotency conflict occurred. Payload does not match original request.",
        409
      );
    }
  }
}

export const transactionsService = new TransactionsService();
