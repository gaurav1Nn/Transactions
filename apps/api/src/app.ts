import express, { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { httpLogger } from "./config/logger.js";
import { env } from "./config/env.js";
import { AppError } from "./shared/app-error.js";
import { prisma } from "./shared/prisma.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { transactionsRouter } from "./modules/transactions/transactions.routes.js";

export interface AppOptions {
  enableRateLimit?: boolean;
  authRateLimitMax?: number;
  rateLimitWindowMs?: number;
  bodyLimit?: string;
  readinessCheck?: () => Promise<void>;
  configureRoutes?: (app: Express) => void;
}

export function createApp(
  optionsOrConfigure?: AppOptions | ((app: Express) => void)
): Express {
  const options: AppOptions =
    typeof optionsOrConfigure === "function"
      ? { configureRoutes: optionsOrConfigure }
      : optionsOrConfigure ?? {};

  const app = express();
  app.set("trust proxy", env.TRUST_PROXY_HOPS);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    })
  );
  app.use(requestIdMiddleware);
  app.use(httpLogger);
  app.use(express.json({ limit: options.bodyLimit || "100kb" }));

  const rateLimitEnabled =
    options.enableRateLimit !== undefined
      ? options.enableRateLimit
      : env.NODE_ENV !== "test";

  if (rateLimitEnabled) {
    const authLimiter = rateLimit({
      windowMs: options.rateLimitWindowMs ?? env.RATE_LIMIT_WINDOW_MS,
      max: options.authRateLimitMax ?? env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message:
              "Too many authentication attempts. Please try again later.",
            requestId: req.id || "unknown",
          },
        });
      },
    });

    app.use("/api/auth/login", authLimiter);
    app.use("/api/auth/register", authLimiter);
  }

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      data: {
        status: "ok",
      },
    });
  });

  app.get("/ready", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      if (options.readinessCheck) {
        await options.readinessCheck();
      } else {
        // Protected requests depend on this table for token revocation.
        await prisma.revokedToken.findFirst({ select: { tokenHash: true } });
      }

      res.status(200).json({ data: { status: "ready" } });
    } catch {
      next(
        new AppError(
          "SERVICE_UNAVAILABLE",
          "Database is unavailable",
          503
        )
      );
    }
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/transactions", transactionsRouter);

  if (options.configureRoutes) {
    options.configureRoutes(app);
  }

  // Not found handler for unmatched routes
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError("NOT_FOUND", "Route not found", 404));
  });

  // Central error handler
  app.use(errorHandler);

  return app;
}
