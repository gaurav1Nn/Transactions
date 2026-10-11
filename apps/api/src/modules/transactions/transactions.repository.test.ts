import { describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  findMany: vi.fn().mockResolvedValue([]),
  count: vi.fn().mockResolvedValue(3),
}));

vi.mock("../../shared/prisma.js", () => ({
  prisma: { transaction: database },
}));

import { TransactionsRepository } from "./transactions.repository.js";

describe("TransactionsRepository.findManyByUserId", () => {
  it("reports the full filtered total when fetching after a cursor", async () => {
    const cursor = {
      createdAt: new Date("2026-10-10T11:00:00.000Z"),
      id: "11111111-1111-4111-8111-111111111111",
    };

    const [, total] = await new TransactionsRepository().findManyByUserId(
      "user-1",
      { skip: 0, take: 2, status: "PENDING", cursor }
    );

    expect(total).toBe(3);
    expect(database.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", status: "PENDING", OR: expect.any(Array) }),
      })
    );
    expect(database.count).toHaveBeenCalledWith({
      where: { userId: "user-1", status: "PENDING" },
    });
  });
});
