import express, { Express, Request, Response, NextFunction } from "express";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { AppError } from "./shared/app-error.js";

export function createApp(
  configureRoutes?: (app: Express) => void
): Express {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      data: {
        status: "ok",
      },
    });
  });

  if (configureRoutes) {
    configureRoutes(app);
  }

  // Not found handler for unmatched routes
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError("NOT_FOUND", "Route not found", 404));
  });

  // Central error handler
  app.use(errorHandler);

  return app;
}
