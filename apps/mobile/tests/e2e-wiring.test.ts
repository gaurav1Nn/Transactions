import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { createApp } from "../../api/src/app.js";
import { prisma } from "../../api/src/shared/prisma.js";
import {
  setBaseUrl,
  setAccessTokenProvider,
  setUnauthorizedHandler,
} from "../src/api/client.js";
import { registerApi, loginApi } from "../src/api/auth.api.js";
import { getCurrentUser } from "../src/api/users.api.js";
import {
  createTransactionApi,
  listTransactionsApi,
  getTransactionApi,
  simulateTransactionApi,
} from "../src/api/transactions.api.js";
import {
  getApiErrorMessage,
  getApiErrorCode,
} from "../src/utils/api-error.js";

describe("Frontend <-> Backend End-to-End Wiring Verification", () => {
  let server: http.Server;
  const PORT = 3099;
  let currentToken: string | null = null;

  beforeAll(async () => {
    // Clean test database tables
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();

    // Start Express app on local test port
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(PORT, "127.0.0.1", () => resolve());
    });

    // Wire frontend API client to this backend server
    setBaseUrl(`http://127.0.0.1:${PORT}`);
    setAccessTokenProvider(() => currentToken);
  });

  afterAll(async () => {
    setAccessTokenProvider(null);
    setUnauthorizedHandler(null);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  });

  it("1. registers a user via frontend registerApi", async () => {
    const authData = await registerApi({
      name: "Wiring Test User",
      email: "wiring.user@example.com",
      password: "Password123!",
    });

    expect(authData).toBeDefined();
    expect(authData.user.name).toBe("Wiring Test User");
    expect(authData.user.email).toBe("wiring.user@example.com");
    expect(authData.accessToken).toBeDefined();

    // Store token in provider for subsequent calls
    currentToken = authData.accessToken;
  });

  it("2. retrieves authenticated user profile via frontend getCurrentUser", async () => {
    const profile = await getCurrentUser();

    expect(profile).toBeDefined();
    expect(profile.email).toBe("wiring.user@example.com");
    expect(profile.name).toBe("Wiring Test User");
    expect(profile).not.toHaveProperty("passwordHash");
  });

  it("3. creates an idempotent transaction via frontend createTransactionApi", async () => {
    const tx = await createTransactionApi(
      {
        amount: "150.00",
        currency: "USD",
        description: "E2E Wired Payment",
      },
      "wiring-idemp-key-1"
    );

    expect(tx).toBeDefined();
    expect(tx.amount).toBe("150.00");
    expect(tx.currency).toBe("USD");
    expect(tx.description).toBe("E2E Wired Payment");
    expect(tx.status).toBe("PENDING");
    expect(tx.transactionId).toMatch(/^TXN-/);
  });

  it("4. lists transaction history via frontend listTransactionsApi", async () => {
    const history = await listTransactionsApi({ page: 1, limit: 10 });

    expect(history).toBeDefined();
    expect(history.items).toHaveLength(1);
    expect(history.items[0].description).toBe("E2E Wired Payment");
    expect(history.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it("5. retrieves transaction details via frontend getTransactionApi", async () => {
    const history = await listTransactionsApi();
    const publicId = history.items[0].transactionId;

    const details = await getTransactionApi(publicId);

    expect(details).toBeDefined();
    expect(details.transactionId).toBe(publicId);
    expect(details.status).toBe("PENDING");
    expect(details.failureReason).toBeNull();
  });

  it("6. simulates transaction outcome via frontend simulateTransactionApi", async () => {
    const history = await listTransactionsApi();
    const publicId = history.items[0].transactionId;

    const updated = await simulateTransactionApi(publicId, "SUCCESS");

    expect(updated).toBeDefined();
    expect(updated.status).toBe("SUCCESS");
    expect(updated.processedAt).toBeDefined();
    expect(typeof updated.processedAt).toBe("string");
  });

  it("7. handles re-simulation conflict (409) via frontend error utilities", async () => {
    const history = await listTransactionsApi();
    const publicId = history.items[0].transactionId;

    try {
      await simulateTransactionApi(publicId, "FAILED");
      expect.fail("Should have thrown 409 conflict");
    } catch (err) {
      expect(getApiErrorCode(err)).toBe("CONFLICT");
      expect(getApiErrorMessage(err)).toBe(
        "Transaction has already been processed"
      );
    }
  });

  it("8. logs in with correct credentials via frontend loginApi", async () => {
    const loginData = await loginApi({
      email: "wiring.user@example.com",
      password: "Password123!",
    });

    expect(loginData).toBeDefined();
    expect(loginData.user.email).toBe("wiring.user@example.com");
    expect(loginData.accessToken).toBeDefined();
  });

  it("9. triggers unauthorized handler on 401 response", async () => {
    let unauthorizedTriggered = false;
    setUnauthorizedHandler(() => {
      unauthorizedTriggered = true;
    });

    // Provide an invalid token
    currentToken = "invalid-token";

    try {
      await getCurrentUser();
      expect.fail("Should have thrown 401 unauthorized");
    } catch (err) {
      expect(unauthorizedTriggered).toBe(true);
      expect(getApiErrorMessage(err)).toBe(
        "Invalid or expired token"
      );
    }
  });
});
