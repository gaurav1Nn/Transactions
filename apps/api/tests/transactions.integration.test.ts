import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/shared/prisma.js";

describe("Transactions API - Creation & Idempotency", () => {
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();

    const app = createApp();
    const regRes = await request(app).post("/api/auth/register").send({
      name: "Transaction Tester",
      email: "tx.tester@example.com",
      password: "Password123!",
    });

    userToken = regRes.body.data.accessToken;
    userId = regRes.body.data.user.id;
  });

  describe("POST /api/transactions - Creation", () => {
    it("valid request returns 201, server-generated ID, and PENDING status", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "tx-idemp-key-1")
        .send({
          amount: "150.75",
          currency: "USD",
          description: "Online payment",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("data");

      const tx = res.body.data;
      expect(tx).toMatchObject({
        amount: "150.75",
        currency: "USD",
        description: "Online payment",
        status: "PENDING",
        failureReason: null,
        processedAt: null,
      });
      expect(tx.id).toBeDefined();
      expect(tx.transactionId).toMatch(/^TXN-/);
      expect(tx.createdAt).toBeDefined();
      expect(tx.updatedAt).toBeDefined();
      expect(tx).not.toHaveProperty("idempotencyKey");
      expect(tx).not.toHaveProperty("userId");
    });

    it("missing or empty Idempotency-Key header returns 422", async () => {
      const app = createApp();

      // Missing header
      const res1 = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          amount: "10.00",
          currency: "USD",
          description: "No idempotency key",
        });
      expect(res1.status).toBe(422);

      // Blank header
      const res2 = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "   ")
        .send({
          amount: "10.00",
          currency: "USD",
          description: "Blank idempotency key",
        });
      expect(res2.status).toBe(422);
    });

    it("rejects zero, negative, over-precision, oversized, malformed currency, and blank description with 422", async () => {
      const app = createApp();
      const base = {
        amount: "10.00",
        currency: "USD",
        description: "Valid description",
      };

      // Zero amount
      const resZero = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "k-zero")
        .send({ ...base, amount: "0.00" });
      expect(resZero.status).toBe(422);

      // Negative amount
      const resNeg = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "k-neg")
        .send({ ...base, amount: "-50.00" });
      expect(resNeg.status).toBe(422);

      // Over-precision (3 decimal places)
      const resPrecision = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "k-prec")
        .send({ ...base, amount: "10.125" });
      expect(resPrecision.status).toBe(422);

      // Oversized (> 9999999999.99)
      const resOversized = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "k-over")
        .send({ ...base, amount: "10000000000.00" });
      expect(resOversized.status).toBe(422);

      // Malformed currency (lowercase or not 3 chars)
      const resCurr = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "k-curr")
        .send({ ...base, currency: "usd" });
      expect(resCurr.status).toBe(422);

      // Blank description
      const resDesc = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "k-desc")
        .send({ ...base, description: "   " });
      expect(resDesc.status).toBe(422);
    });

    it("decimal 0.10 and large decimal 9999999999.99 round-trip without floating-point error", async () => {
      const app = createApp();

      const resSmall = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "k-small")
        .send({
          amount: "0.10",
          currency: "USD",
          description: "Small fractional payment",
        });
      expect(resSmall.status).toBe(201);
      expect(resSmall.body.data.amount).toBe("0.10");

      const resLarge = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "k-large")
        .send({
          amount: "9999999999.99",
          currency: "USD",
          description: "Maximum boundary payment",
        });
      expect(resLarge.status).toBe(201);
      expect(resLarge.body.data.amount).toBe("9999999999.99");
    });
  });

  describe("POST /api/transactions - Idempotency", () => {
    it("exact replay returns 200 and original transaction", async () => {
      const app = createApp();
      const payload = {
        amount: "50.00",
        currency: "EUR",
        description: "European server hosting",
      };

      const firstRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "idemp-exact-replay")
        .send(payload);

      expect(firstRes.status).toBe(201);
      const originalTx = firstRes.body.data;

      const secondRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "idemp-exact-replay")
        .send(payload);

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.data).toEqual(originalTx);

      // Verify database still only has 1 record
      const count = await prisma.transaction.count({
        where: { userId },
      });
      expect(count).toBe(1);
    });

    it("replay with changed payload returns 409 Conflict", async () => {
      const app = createApp();
      const initialPayload = {
        amount: "50.00",
        currency: "USD",
        description: "Initial description",
      };

      const firstRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "idemp-changed-key")
        .send(initialPayload);
      expect(firstRes.status).toBe(201);

      // Changed amount
      const resDiffAmount = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "idemp-changed-key")
        .send({ ...initialPayload, amount: "75.00" });
      expect(resDiffAmount.status).toBe(409);
      expect(resDiffAmount.body.error.code).toBe("IDEMPOTENCY_CONFLICT");

      // Changed currency
      const resDiffCurrency = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "idemp-changed-key")
        .send({ ...initialPayload, currency: "GBP" });
      expect(resDiffCurrency.status).toBe(409);
      expect(resDiffCurrency.body.error.code).toBe("IDEMPOTENCY_CONFLICT");

      // Changed description
      const resDiffDesc = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "idemp-changed-key")
        .send({ ...initialPayload, description: "Altered description" });
      expect(resDiffDesc.status).toBe(409);
      expect(resDiffDesc.body.error.code).toBe("IDEMPOTENCY_CONFLICT");
    });

    it("parallel requests with same key produce exactly one transaction row", async () => {
      const app = createApp();
      const payload = {
        amount: "100.00",
        currency: "USD",
        description: "Parallel payment test",
      };
      const key = "parallel-key-race";

      const [res1, res2] = await Promise.all([
        request(app)
          .post("/api/transactions")
          .set("Authorization", `Bearer ${userToken}`)
          .set("Idempotency-Key", key)
          .send(payload),
        request(app)
          .post("/api/transactions")
          .set("Authorization", `Bearer ${userToken}`)
          .set("Idempotency-Key", key)
          .send(payload),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 201]);

      const count = await prisma.transaction.count({
        where: { userId, idempotencyKey: key },
      });
      expect(count).toBe(1);
    });
  });
});
