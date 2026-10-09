import { Request, Response, NextFunction } from "express";
import {
  TransactionsService,
  transactionsService,
} from "./transactions.service.js";

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
      const userId = req.user!.id;
      const idempotencyKey = req.headers["idempotency-key"] as string;

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
}

export const transactionsController = new TransactionsController();
