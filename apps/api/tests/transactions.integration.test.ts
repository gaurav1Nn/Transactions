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

    it("treats whitespace around an idempotency key as the same key", async () => {
      const app = createApp();
      const payload = {
        amount: "25.00",
        currency: "USD",
        description: "Whitespace key",
      };

      const first = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "  normalized-key  ")
        .send(payload);
      const replay = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "normalized-key")
        .send(payload);

      expect(first.status).toBe(201);
      expect(replay.status).toBe(200);
      expect(replay.body.data.id).toBe(first.body.data.id);
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

    it("different users using the same idempotency key both create distinct transactions", async () => {
      const app = createApp();

      // Register user B
      const userBRes = await request(app).post("/api/auth/register").send({
        name: "User B Idemp",
        email: "userb.idemp@example.com",
        password: "Password123!",
      });
      const userBToken = userBRes.body.data.accessToken;

      const sharedKey = "shared-idempotency-key-xyz";

      const resA = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", sharedKey)
        .send({ amount: "40.00", currency: "USD", description: "User A tx" });

      const resB = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userBToken}`)
        .set("Idempotency-Key", sharedKey)
        .send({ amount: "80.00", currency: "EUR", description: "User B tx" });

      expect(resA.status).toBe(201);
      expect(resB.status).toBe(201);
      expect(resA.body.data.transactionId).not.toBe(resB.body.data.transactionId);
      expect(resA.body.data.amount).toBe("40.00");
      expect(resB.body.data.amount).toBe("80.00");
    });
  });

  describe("GET /api/transactions - History", () => {
    it("results contain only the authenticated user's records in descending order", async () => {
      const app = createApp();

      // Register a second user
      const otherRes = await request(app).post("/api/auth/register").send({
        name: "Other User",
        email: "other@example.com",
        password: "Password123!",
      });
      const otherToken = otherRes.body.data.accessToken;

      // Create 2 transactions for primary user
      await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "user-tx-1")
        .send({ amount: "10.00", currency: "USD", description: "First Tx" });

      await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "user-tx-2")
        .send({ amount: "20.00", currency: "USD", description: "Second Tx" });

      // Create 1 transaction for other user
      await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${otherToken}`)
        .set("Idempotency-Key", "other-tx-1")
        .send({ amount: "99.00", currency: "EUR", description: "Other User Tx" });

      // Fetch primary user history
      const res = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });

      // Newest first
      expect(res.body.data.items[0].description).toBe("Second Tx");
      expect(res.body.data.items[1].description).toBe("First Tx");
    });

    it("page, limit, and status filters are validated", async () => {
      const app = createApp();

      const res1 = await request(app)
        .get("/api/transactions?page=0")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res1.status).toBe(422);

      const res2 = await request(app)
        .get("/api/transactions?limit=101")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res2.status).toBe(422);

      const res3 = await request(app)
        .get("/api/transactions?status=INVALID")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res3.status).toBe(422);

      const res4 = await request(app)
        .get("/api/transactions?page=100001")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res4.status).toBe(422);
    });

    it("filters history by status when provided", async () => {
      const app = createApp();

      await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "filter-test-1")
        .send({ amount: "15.00", currency: "USD", description: "Filter Tx" });

      const resPending = await request(app)
        .get("/api/transactions?status=PENDING")
        .set("Authorization", `Bearer ${userToken}`);
      expect(resPending.status).toBe(200);
      expect(resPending.body.data.items.length).toBeGreaterThan(0);
      expect(
        resPending.body.data.items.every(
          (tx: { status: string }) => tx.status === "PENDING"
        )
      ).toBe(true);

      const resSuccess = await request(app)
        .get("/api/transactions?status=SUCCESS")
        .set("Authorization", `Bearer ${userToken}`);
      expect(resSuccess.status).toBe(200);
      expect(resSuccess.body.data.items).toHaveLength(0);
    });

    it("empty history returns zero totals and empty items array", async () => {
      const app = createApp();
      // user has no transactions yet in this test block
      const res = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it("requesting page beyond total count returns empty items list", async () => {
      const app = createApp();
      await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "page-test-key")
        .send({ amount: "20.00", currency: "USD", description: "One tx" });

      const res = await request(app)
        .get("/api/transactions?page=2&limit=10")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.pagination.page).toBe(2);
      expect(res.body.data.pagination.total).toBe(1);
      expect(res.body.data.pagination.totalPages).toBe(1);
    });

    it("cursor pages return every transaction exactly once, newest first, including same-timestamp ties", async () => {
      const app = createApp();
      const base = Date.UTC(2026, 9, 12, 12, 0, 0);
      // 45 rows over 3 pages of 20; every third row shares a timestamp with its neighbour,
      // so ties straddle page boundaries and rely on the id tie-breaker.
      await prisma.transaction.createMany({
        data: Array.from({ length: 45 }, (_, i) => ({
          transactionId: `TXN-PAGE-${String(i).padStart(3, "0")}`,
          userId,
          idempotencyKey: `page-key-${i}`,
          amount: "1.00",
          currency: "USD",
          description: `Row ${i}`,
          status: (["PENDING", "SUCCESS", "FAILED"] as const)[i % 3],
          createdAt: new Date(base + Math.floor(i / 3) * 2 * 1000 + (i % 3 === 2 ? 0 : (i % 3) * 7)),
        })),
      });
      const expected = await prisma.transaction.findMany({
        where: { userId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { transactionId: true, status: true },
      });

      const walk = async (status?: string) => {
        const seen: string[] = [];
        let cursor: string | undefined;
        for (let guard = 0; guard < 10; guard++) {
          const res = await request(app)
            .get("/api/transactions")
            .query({ limit: 20, ...(status ? { status } : {}), ...(cursor ? { cursor } : {}) })
            .set("Authorization", `Bearer ${userToken}`);
          expect(res.status).toBe(200);
          seen.push(...res.body.data.items.map((t: { transactionId: string }) => t.transactionId));
          cursor = res.body.data.pagination.nextCursor;
          if (!cursor) break;
        }
        return seen;
      };

      expect(await walk()).toEqual(expected.map((t) => t.transactionId));
      for (const status of ["PENDING", "SUCCESS", "FAILED"]) {
        expect(await walk(status)).toEqual(
          expected.filter((t) => t.status === status).map((t) => t.transactionId)
        );
      }
    });
  });

  describe("GET /api/transactions/:id - Details & Ownership", () => {
    it("owner receives transaction details without internal fields", async () => {
      const app = createApp();

      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "details-key-1")
        .send({ amount: "45.00", currency: "USD", description: "Details Tx" });

      const txId = createRes.body.data.transactionId;

      const res = await request(app)
        .get(`/api/transactions/${txId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        transactionId: txId,
        amount: "45.00",
        currency: "USD",
        description: "Details Tx",
        status: "PENDING",
      });
      expect(res.body.data).not.toHaveProperty("idempotencyKey");
      expect(res.body.data).not.toHaveProperty("userId");
    });

    it("non-existent transaction and another user's transaction both return identical 404", async () => {
      const app = createApp();

      // Register other user and create a transaction
      const otherRes = await request(app).post("/api/auth/register").send({
        name: "User B",
        email: "userb@example.com",
        password: "Password123!",
      });
      const otherToken = otherRes.body.data.accessToken;

      const otherTxRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${otherToken}`)
        .set("Idempotency-Key", "b-tx-key")
        .send({ amount: "70.00", currency: "USD", description: "B's Secret Tx" });

      const bTxId = otherTxRes.body.data.transactionId;

      // User A attempts to read User B's transaction
      const resOtherUser = await request(app)
        .get(`/api/transactions/${bTxId}`)
        .set("Authorization", `Bearer ${userToken}`);

      // User A attempts to read non-existent transaction
      const resNonExistent = await request(app)
        .get("/api/transactions/TXN-NONEXISTENT-999")
        .set("Authorization", `Bearer ${userToken}`);
      expect(resOtherUser.status).toBe(404);
      expect(resNonExistent.status).toBe(404);
      expect(resOtherUser.body.error.code).toBe("NOT_FOUND");
      expect(resNonExistent.body.error.code).toBe("NOT_FOUND");
      expect(resOtherUser.body.error.message).toBe("Transaction not found");
      expect(resNonExistent.body.error.message).toBe("Transaction not found");
    });

    it("owner can query transaction by internal UUID as well as public transactionId", async () => {
      const app = createApp();
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "uuid-lookup-key")
        .send({ amount: "65.00", currency: "USD", description: "UUID Lookup Tx" });

      const internalUuid = createRes.body.data.id;
      const publicTxId = createRes.body.data.transactionId;

      // Query by internal UUID
      const resUuid = await request(app)
        .get(`/api/transactions/${internalUuid}`)
        .set("Authorization", `Bearer ${userToken}`);

      // Query by public transaction ID
      const resPublic = await request(app)
        .get(`/api/transactions/${publicTxId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(resUuid.status).toBe(200);
      expect(resPublic.status).toBe(200);
      expect(resUuid.body.data.transactionId).toBe(publicTxId);
      expect(resPublic.body.data.id).toBe(internalUuid);
    });

    it("handles special characters, unicode, and quotes in transaction description", async () => {
      const app = createApp();
      const specialDesc = "Café & Co. 'Special' <Deal> 100% 🚀 — \"Punctuation/Test\"";
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "special-desc-key")
        .send({ amount: "12.34", currency: "EUR", description: specialDesc });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.description).toBe(specialDesc);

      const txId = createRes.body.data.transactionId;
      const getRes = await request(app)
        .get(`/api/transactions/${txId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.description).toBe(specialDesc);
    });
  });

  describe("POST /api/transactions/:id/simulate - Simulation", () => {
    it("pending -> success sets status and processedAt", async () => {
      const app = createApp();
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "sim-success-key")
        .send({ amount: "50.00", currency: "USD", description: "Success Sim" });

      const txId = createRes.body.data.transactionId;

      const res = await request(app)
        .post(`/api/transactions/${txId}/simulate`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ outcome: "SUCCESS" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("SUCCESS");
      expect(res.body.data.processedAt).toBeDefined();
      expect(typeof res.body.data.processedAt).toBe("string");
      expect(res.body.data.failureReason).toBeNull();
    });

    it("pending -> failed sets status, processedAt, and safe mock failure reason", async () => {
      const app = createApp();
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "sim-fail-key")
        .send({ amount: "25.00", currency: "USD", description: "Fail Sim" });

      const txId = createRes.body.data.transactionId;

      const res = await request(app)
        .post(`/api/transactions/${txId}/simulate`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ outcome: "FAILED" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("FAILED");
      expect(res.body.data.processedAt).toBeDefined();
      expect(typeof res.body.data.processedAt).toBe("string");
      expect(res.body.data.failureReason).toBe("Payment simulation failed");

      // Confirm persistence via GET details
      const getRes = await request(app)
        .get(`/api/transactions/${txId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.status).toBe("FAILED");
      expect(getRes.body.data.failureReason).toBe("Payment simulation failed");
      expect(getRes.body.data.processedAt).toBe(res.body.data.processedAt);
    });

    it("invalid outcome returns 422", async () => {
      const app = createApp();
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "sim-inv-key")
        .send({ amount: "10.00", currency: "USD", description: "Inv Sim" });

      const txId = createRes.body.data.transactionId;

      const res = await request(app)
        .post(`/api/transactions/${txId}/simulate`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ outcome: "INVALID" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("another user's transaction returns 404", async () => {
      const app = createApp();

      const otherRes = await request(app).post("/api/auth/register").send({
        name: "User Sim B",
        email: "usersimb@example.com",
        password: "Password123!",
      });
      const otherToken = otherRes.body.data.accessToken;

      const otherTxRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${otherToken}`)
        .set("Idempotency-Key", "other-sim-key")
        .send({ amount: "80.00", currency: "USD", description: "B Sim Tx" });
      const otherTxId = otherTxRes.body.data.transactionId;

      const res = await request(app)
        .post(`/api/transactions/${otherTxId}/simulate`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ outcome: "SUCCESS" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
      expect(res.body.error.message).toBe("Transaction not found");
    });

    it("re-simulation returns 409 and preserves original status and timestamp", async () => {
      const app = createApp();
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "sim-resim-key")
        .send({ amount: "30.00", currency: "USD", description: "Re-sim Tx" });

      const txId = createRes.body.data.transactionId;

      const firstSim = await request(app)
        .post(`/api/transactions/${txId}/simulate`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ outcome: "SUCCESS" });

      expect(firstSim.status).toBe(200);
      const originalProcessedAt = firstSim.body.data.processedAt;

      const secondSim = await request(app)
        .post(`/api/transactions/${txId}/simulate`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ outcome: "FAILED" });

      expect(secondSim.status).toBe(409);
      expect(secondSim.body.error.code).toBe("CONFLICT");

      // Check details to ensure state and processedAt were preserved
      const detailRes = await request(app)
        .get(`/api/transactions/${txId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(detailRes.body.data.status).toBe("SUCCESS");
      expect(detailRes.body.data.processedAt).toBe(originalProcessedAt);
      expect(detailRes.body.data.failureReason).toBeNull();
    });

    it("two simultaneous simulation requests result in one terminal transition", async () => {
      const app = createApp();
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "sim-concurrent-key")
        .send({ amount: "100.00", currency: "USD", description: "Concurrent Sim" });

      const txId = createRes.body.data.transactionId;

      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/transactions/${txId}/simulate`)
          .set("Authorization", `Bearer ${userToken}`)
          .send({ outcome: "SUCCESS" }),
        request(app)
          .post(`/api/transactions/${txId}/simulate`)
          .set("Authorization", `Bearer ${userToken}`)
          .send({ outcome: "FAILED" }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 409]);

      const detailRes = await request(app)
        .get(`/api/transactions/${txId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(["SUCCESS", "FAILED"]).toContain(detailRes.body.data.status);
    });

    it("can simulate transaction using internal UUID as path parameter", async () => {
      const app = createApp();
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Idempotency-Key", "uuid-sim-key")
        .send({ amount: "33.00", currency: "USD", description: "UUID Sim" });

      const internalUuid = createRes.body.data.id;

      const simRes = await request(app)
        .post(`/api/transactions/${internalUuid}/simulate`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ outcome: "SUCCESS" });

      expect(simRes.status).toBe(200);
      expect(simRes.body.data.status).toBe("SUCCESS");
      expect(simRes.body.data.id).toBe(internalUuid);
    });
  });
});
