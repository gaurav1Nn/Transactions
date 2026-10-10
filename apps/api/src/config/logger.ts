import pino from "pino";
import pinoHttp from "pino-http";
import { env } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers['authorization']",
      "req.headers.cookie",
      "password",
      "*.password",
      "passwordHash",
      "*.passwordHash",
      "token",
      "*.token",
      "accessToken",
      "*.accessToken",
      "DATABASE_URL",
      "JWT_SECRET",
    ],
    censor: "[REDACTED]",
  },
});
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    if (req && typeof req === "object" && "id" in req && typeof req.id === "string") {
      return req.id;
    }
    return "unknown";
  },
  autoLogging: env.NODE_ENV !== "test",
});
