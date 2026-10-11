import { z } from "zod";
import { decodeTransactionCursor } from "./transaction-cursor.js";

const amountRegex = /^(?:[1-9]\d{0,9}|0)\.\d{2}$/;

export function normalizeIdempotencyKey(
  value: string | string[] | undefined
): string {
  const key = Array.isArray(value) ? value[0] : value;
  return key?.trim() ?? "";
}

export const createTransactionSchema = z.object({
  headers: z.object({
    "idempotency-key": z
      .string({
        required_error: "Idempotency-Key header is required",
      })
      .trim()
      .min(1, "Idempotency-Key header must not be empty")
      .max(128, "Idempotency-Key must not exceed 128 characters"),
  }),
  body: z.object({
    amount: z
      .string({ required_error: "Amount is required" })
      .regex(
        amountRegex,
        "Amount must be a numeric string with exactly two decimal places (e.g. '10.50')"
      )
      .refine(
        (val) => {
          const num = parseFloat(val);
          return num > 0 && num <= 9999999999.99;
        },
        {
          message:
            "Amount must be greater than 0 and less than or equal to 9,999,999,999.99",
        }
      ),
    currency: z
      .string({ required_error: "Currency is required" })
      .trim()
      .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter uppercase ISO code"),
    description: z
      .string({ required_error: "Description is required" })
      .trim()
      .min(1, "Description is required")
      .max(255, "Description must not exceed 255 characters"),
  }),
});

export const listTransactionsSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int()
      .min(1, "Page must be at least 1")
      .max(100000, "Page must not exceed 100,000")
      .default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(100, "Limit must not exceed 100")
      .default(20),
    cursor: z
      .string()
      .trim()
      .min(1, "Cursor must not be empty")
      .refine(
        (value) => {
          try {
            decodeTransactionCursor(value);
            return true;
          } catch {
            return false;
          }
        },
        "Cursor is invalid"
      )
      .optional(),
    status: z.enum(["PENDING", "SUCCESS", "FAILED"]).optional(),
  }),
});

export const getTransactionSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Transaction ID is required"),
  }),
});

export const simulateTransactionSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Transaction ID is required"),
  }),
  body: z.object({
    outcome: z.enum(["SUCCESS", "FAILED"], {
      errorMap: () => ({ message: "Outcome must be SUCCESS or FAILED" }),
    }),
  }),
});

export type CreateTransactionInput = z.infer<
  typeof createTransactionSchema
>["body"];
export type ListTransactionsQuery = z.infer<
  typeof listTransactionsSchema
>["query"];
export type SimulateTransactionInput = z.infer<
  typeof simulateTransactionSchema
>["body"];
