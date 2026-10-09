import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { createTransactionSchema } from "./transactions.schemas.js";
import { transactionsController } from "./transactions.controller.js";

export const transactionsRouter = Router();

transactionsRouter.post(
  "/",
  authenticate,
  validate(createTransactionSchema),
  transactionsController.create
);
