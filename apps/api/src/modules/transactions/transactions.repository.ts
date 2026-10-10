import { Transaction, Prisma, TransactionStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";

export class TransactionsRepository {
  async findByIdempotencyKey(
    userId: string,
    idempotencyKey: string
  ): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: {
        userId_idempotencyKey: {
          userId,
          idempotencyKey,
        },
      },
    });
  }

  async findByTransactionId(
    transactionId: string
  ): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { transactionId },
    });
  }

  async findOwnedTransaction(
    userId: string,
    idOrTransactionId: string
  ): Promise<Transaction | null> {
    // UUID regex check to prevent PostgreSQL syntax errors when querying uuid column
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrTransactionId
      );

    const conditions: Prisma.TransactionWhereInput[] = [
      { transactionId: idOrTransactionId },
    ];

    if (isUuid) {
      conditions.push({ id: idOrTransactionId });
    }

    return prisma.transaction.findFirst({
      where: {
        userId,
        OR: conditions,
      },
    });
  }

  async findManyByUserId(
    userId: string,
    query: {
      skip: number;
      take: number;
      status?: TransactionStatus;
    }
  ): Promise<[Transaction[], number]> {
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    return Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.take,
      }),
      prisma.transaction.count({ where }),
    ]);
  }

  async create(data: {
    transactionId: string;
    userId: string;
    idempotencyKey: string;
    amount: Prisma.Decimal;
    currency: string;
    description: string;
  }): Promise<Transaction> {
    return prisma.transaction.create({
      data,
    });
  }
}

export const transactionsRepository = new TransactionsRepository();
