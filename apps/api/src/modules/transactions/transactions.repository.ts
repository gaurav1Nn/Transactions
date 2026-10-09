import { Transaction, Prisma } from "@prisma/client";
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

  async findByTransactionId(transactionId: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { transactionId },
    });
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
