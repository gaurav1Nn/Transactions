process.env.NODE_ENV = "test";
const userPart = process.env.USER ? `${process.env.USER}@` : "";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${userPart}localhost:5432/ace_test`;
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  "test-secret-at-least-32-characters-long-safe-for-testing";
process.env.LOG_LEVEL = "silent";
