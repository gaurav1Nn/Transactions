if (process.env.NODE_ENV && process.env.NODE_ENV !== "test") {
  throw new Error("Test setup must only run when NODE_ENV === 'test'");
}

process.env.NODE_ENV = "test";
process.env.PORT = "3001";

const userPart = process.env.USER ? `${process.env.USER}@` : "";
const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  `postgresql://${userPart}localhost:5432/ace_test`;

const dbName = new URL(testDbUrl).pathname.replace(/^\//, "");
if (!dbName.endsWith("_test")) {
  throw new Error(
    `Test setup must refuse to run unless the database name ends with '_test', got: '${dbName}'`
  );
}

process.env.DATABASE_URL = testDbUrl;
process.env.JWT_SECRET =
  "test-secret-at-least-32-characters-long-safe-for-testing";
process.env.JWT_EXPIRES_IN = "24h";
process.env.BCRYPT_ROUNDS = "4";
process.env.LOG_LEVEL = "silent";
process.env.CORS_ORIGINS = "*";
