import { resolveTestDatabaseUrl } from "./test-db.js";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = resolveTestDatabaseUrl(process.env);
process.env.JWT_SECRET =
  process.env.JWT_SECRET ??
  "test-secret-at-least-32-characters-long-safe-for-testing";
process.env.LOG_LEVEL = "silent";
