import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/shared/prisma.js";

describe("User Registration API", () => {
  beforeEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
  });

  it("valid request returns 201, safe user fields, and JWT", async () => {
    const app = createApp();
    const payload = {
      name: "Alice Smith",
      email: "alice@example.com",
      password: "Password123!",
    };

    const res = await request(app).post("/api/auth/register").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data).toHaveProperty("user");

    const { user, accessToken } = res.body.data;
    expect(user).toMatchObject({
      name: "Alice Smith",
      email: "alice@example.com",
    });
    expect(user.id).toBeDefined();
    expect(user.createdAt).toBeDefined();
    expect(user).not.toHaveProperty("passwordHash");
    expect(user).not.toHaveProperty("password");
    expect(typeof accessToken).toBe("string");

    // Check database state directly
    const dbUser = await prisma.user.findUnique({
      where: { email: "alice@example.com" },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser!.passwordHash).not.toBe(payload.password);
    expect(dbUser!.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("duplicate email returns 409 Conflict even with different casing", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send({
      name: "First User",
      email: "unique.user@example.com",
      password: "Password123!",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Second User",
      email: "UNIQUE.USER@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_EXISTS");
  });

  it("rejects invalid email, short password, blank name with 422", async () => {
    const app = createApp();

    // Invalid email
    const res1 = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "not-an-email",
      password: "Password123!",
    });
    expect(res1.status).toBe(422);
    expect(res1.body.error.code).toBe("VALIDATION_ERROR");

    // Short password (< 8 characters)
    const res2 = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice2@example.com",
      password: "short",
    });
    expect(res2.status).toBe(422);
    expect(res2.body.error.code).toBe("VALIDATION_ERROR");

    // Blank name
    const res3 = await request(app).post("/api/auth/register").send({
      name: "   ",
      email: "alice3@example.com",
      password: "Password123!",
    });
    expect(res3.status).toBe(422);
    expect(res3.body.error.code).toBe("VALIDATION_ERROR");
  });
});
