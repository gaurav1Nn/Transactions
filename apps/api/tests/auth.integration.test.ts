import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { prisma } from "../src/shared/prisma.js";
import { env } from "../src/config/env.js";

describe("User Authentication & Profile API", () => {
  beforeEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("POST /api/auth/register", () => {
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

      const res1 = await request(app).post("/api/auth/register").send({
        name: "Alice",
        email: "not-an-email",
        password: "Password123!",
      });
      expect(res1.status).toBe(422);
      expect(res1.body.error.code).toBe("VALIDATION_ERROR");

      const res2 = await request(app).post("/api/auth/register").send({
        name: "Alice",
        email: "alice2@example.com",
        password: "short",
      });
      expect(res2.status).toBe(422);
      expect(res2.body.error.code).toBe("VALIDATION_ERROR");

      const res3 = await request(app).post("/api/auth/register").send({
        name: "   ",
        email: "alice3@example.com",
        password: "Password123!",
      });
      expect(res3.status).toBe(422);
      expect(res3.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects passwords that exceed bcrypt's 72-byte input limit", async () => {
      const app = createApp();
      const res = await request(app).post("/api/auth/register").send({
        name: "Long Password User",
        email: "long-password@example.com",
        password: `${"a".repeat(72)}1`,
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const app = createApp();
      await request(app).post("/api/auth/register").send({
        name: "Bob Jones",
        email: "bob@example.com",
        password: "CorrectPassword123!",
      });
    });

    it("valid credentials return 200 and usable JWT", async () => {
      const app = createApp();
      const res = await request(app).post("/api/auth/login").send({
        email: "bob@example.com",
        password: "CorrectPassword123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data.user).toMatchObject({
        name: "Bob Jones",
        email: "bob@example.com",
      });
      expect(res.body.data.user).not.toHaveProperty("passwordHash");
    });

    it("login normalizes email casing and whitespace", async () => {
      const app = createApp();
      const res = await request(app).post("/api/auth/login").send({
        email: "  BOB@EXAMPLE.COM  ",
        password: "CorrectPassword123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("bob@example.com");
    });

    it("unknown email and wrong password both return identical generic 401", async () => {
      const app = createApp();

      const resUnknown = await request(app).post("/api/auth/login").send({
        email: "unknown@example.com",
        password: "CorrectPassword123!",
      });

      const resWrongPw = await request(app).post("/api/auth/login").send({
        email: "bob@example.com",
        password: "WrongPassword!",
      });

      expect(resUnknown.status).toBe(401);
      expect(resWrongPw.status).toBe(401);
      expect(resUnknown.body.error.code).toBe("UNAUTHORIZED");
      expect(resWrongPw.body.error.code).toBe("UNAUTHORIZED");
      expect(resUnknown.body.error.message).toBe("Invalid email or password");
      expect(resWrongPw.body.error.message).toBe("Invalid email or password");
    });
  });

  describe("GET /api/users/me", () => {
    let validToken: string;

    beforeEach(async () => {
      const app = createApp();
      const reg = await request(app).post("/api/auth/register").send({
        name: "Carol White",
        email: "carol@example.com",
        password: "Password123!",
      });
      validToken = reg.body.data.accessToken;
    });

    it("valid Bearer token returns own profile", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        name: "Carol White",
        email: "carol@example.com",
      });
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.createdAt).toBeDefined();
      expect(res.body.data).not.toHaveProperty("passwordHash");
    });

    it("missing Authorization header returns 401", async () => {
      const app = createApp();
      const res = await request(app).get("/api/users/me");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("altered or expired token returns 401", async () => {
      const app = createApp();

      // Altered token
      const tampered = validToken.slice(0, -6) + "xyz123";
      const res1 = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${tampered}`);
      expect(res1.status).toBe(401);
      expect(res1.body.error.code).toBe("UNAUTHORIZED");

      // Expired token
      const expired = jwt.sign(
        { sub: "550e8400-e29b-41d4-a716-446655440000" },
        env.JWT_SECRET,
        { expiresIn: "-1s" }
      );
      const res2 = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${expired}`);
      expect(res2.status).toBe(401);
      expect(res2.body.error.code).toBe("UNAUTHORIZED");
    });

    it("valid JWT for non-existent user returns 404 NOT_FOUND", async () => {
      const app = createApp();
      const tokenForGhost = jwt.sign(
        { sub: "00000000-0000-0000-0000-000000000000" },
        env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${tokenForGhost}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
      expect(res.body.error.message).toBe("User not found");
    });
  });

  it("revokes only the current bearer token on logout", async () => {
    const app = createApp();
    const registered = await request(app).post("/api/auth/register").send({
      name: "Logout User",
      email: "logout@example.com",
      password: "Password123!",
    });
    const firstToken = registered.body.data.accessToken as string;

    const loggedOut = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${firstToken}`);
    expect(loggedOut.status).toBe(204);

    const rejected = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${firstToken}`);
    expect(rejected.status).toBe(401);

    const login = await request(app).post("/api/auth/login").send({
      email: "logout@example.com",
      password: "Password123!",
    });
    const secondToken = login.body.data.accessToken as string;
    expect(secondToken).not.toBe(firstToken);

    const accepted = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${secondToken}`);
    expect(accepted.status).toBe(200);
  });

  it("keeps logout successful if expired-token cleanup fails after revocation", async () => {
    const app = createApp();
    const registered = await request(app).post("/api/auth/register").send({
      name: "Cleanup User",
      email: "cleanup@example.com",
      password: "Password123!",
    });
    const token = registered.body.data.accessToken as string;
    const cleanup = vi.spyOn(prisma.revokedToken, "deleteMany").mockRejectedValueOnce(
      new Error("cleanup unavailable")
    );
    try {
      const loggedOut = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);
      expect(loggedOut.status).toBe(204);

      const rejected = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);
      expect(rejected.status).toBe(401);
    } finally {
      cleanup.mockRestore();
    }
  });
});
