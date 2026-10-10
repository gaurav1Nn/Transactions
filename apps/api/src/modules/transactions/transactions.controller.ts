import { Request, Response, NextFunction } from "express";
import {
  TransactionsService,
  transactionsService,
} from "./transactions.service.js";
import { ListTransactionsQuery } from "./transactions.schemas.js";
import { AppError } from "../../shared/app-error.js";
export class TransactionsController {
  constructor(
    private service: TransactionsService = transactionsService
  ) {}

  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("UNAUTHORIZED", "Authentication required", 401);
      }
      const userId = req.user.id;
      const rawKey = req.headers["idempotency-key"];
      const idempotencyKey = Array.isArray(rawKey) ? rawKey[0] : (rawKey ?? "");
      const result = await this.service.createTransaction(
        userId,
        idempotencyKey,
        req.body
      );

      const statusCode = result.created ? 201 : 200;
      res.status(statusCode).json({
        data: result.transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("UNAUTHORIZED", "Authentication required", 401);
      }
      const userId = req.user.id;
      const query = req.query as unknown as ListTransactionsQuery;
      const result = await this.service.listTransactions(userId, query);
      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("UNAUTHORIZED", "Authentication required", 401);
      }
      const userId = req.user.id;
      const id = req.params.id;
      const result = await this.service.getTransaction(userId, id);
      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  simulate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("UNAUTHORIZED", "Authentication required", 401);
      }
      const userId = req.user.id;
      const id = req.params.id;
      const { outcome } = req.body;
      const result = await this.service.simulateTransaction(
        userId,
        id,
        outcome
      );
      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const transactionsController = new TransactionsController();
