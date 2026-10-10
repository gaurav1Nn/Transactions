import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/shared/prisma.js";

describe("Database Schema & Constraints", () => {
  beforeAll(async () => {
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("rejects duplicate email", async () => {
    const email = "test.user@example.com";
    await prisma.user.create({
      data: {
        name: "Test User 1",
        email,
        passwordHash: "hash1",
      },
    });

    await expect(
      prisma.user.create({
        data: {
          name: "Test User 2",
          email,
          passwordHash: "hash2",
        },
      })
    ).rejects.toThrow();
  });

  it("rejects duplicate transactionId", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Transaction Owner",
        email: "tx.owner@example.com",
        passwordHash: "hash",
      },
    });

    const transactionId = "TXN-TEST-123";

    await prisma.transaction.create({
      data: {
        transactionId,
        userId: user.id,
        idempotencyKey: "key-1",
        amount: "50.00",
        currency: "USD",
        description: "First Tx",
        status: "PENDING",
      },
    });

    await expect(
      prisma.transaction.create({
        data: {
          transactionId,
          userId: user.id,
          idempotencyKey: "key-2",
          amount: "50.00",
          currency: "USD",
          description: "Duplicate Tx ID",
          status: "PENDING",
        },
      })
    ).rejects.toThrow();
  });

  it("rejects duplicate (userId, idempotencyKey) for same user", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Idempotency User",
        email: "idempotency@example.com",
        passwordHash: "hash",
      },
    });

    const idempotencyKey = "unique-client-key-1";

    await prisma.transaction.create({
      data: {
        transactionId: "TXN-IDEMP-1",
        userId: user.id,
        idempotencyKey,
        amount: "100.00",
        currency: "USD",
        description: "Initial Payment",
        status: "PENDING",
      },
    });

    await expect(
      prisma.transaction.create({
        data: {
          transactionId: "TXN-IDEMP-2",
          userId: user.id,
          idempotencyKey,
          amount: "100.00",
          currency: "USD",
          description: "Replayed Payment",
          status: "PENDING",
        },
      })
    ).rejects.toThrow();
  });

  it("allows different users to use the same idempotencyKey", async () => {
    const user1 = await prisma.user.create({
      data: {
        name: "User One",
        email: "user1.idemp@example.com",
        passwordHash: "hash1",
      },
    });

    const user2 = await prisma.user.create({
      data: {
        name: "User Two",
        email: "user2.idemp@example.com",
        passwordHash: "hash2",
      },
    });

    const sharedKey = "shared-client-key-100";

    const tx1 = await prisma.transaction.create({
      data: {
        transactionId: "TXN-SHARED-1",
        userId: user1.id,
        idempotencyKey: sharedKey,
        amount: "50.00",
        currency: "USD",
        description: "User 1 tx",
        status: "PENDING",
      },
    });

    const tx2 = await prisma.transaction.create({
      data: {
        transactionId: "TXN-SHARED-2",
        userId: user2.id,
        idempotencyKey: sharedKey,
        amount: "50.00",
        currency: "USD",
        description: "User 2 tx",
        status: "PENDING",
      },
    });

    expect(tx1.idempotencyKey).toBe(sharedKey);
    expect(tx2.idempotencyKey).toBe(sharedKey);
    expect(tx1.userId).not.toBe(tx2.userId);
  });

  it("cascades delete from user to transactions", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Cascade User",
        email: "cascade@example.com",
        passwordHash: "hash",
      },
    });

    await prisma.transaction.create({
      data: {
        transactionId: "TXN-CASCADE-1",
        userId: user.id,
        idempotencyKey: "cascade-key-1",
        amount: "25.00",
        currency: "USD",
        description: "Cascade tx",
        status: "PENDING",
      },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const remaining = await prisma.transaction.findMany({
      where: { userId: user.id },
    });
    expect(remaining).toHaveLength(0);
  });
});
