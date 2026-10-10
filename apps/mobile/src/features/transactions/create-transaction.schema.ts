import { z } from "zod";

const amountRegex = /^(?:[1-9]\d{0,9}|0)\.\d{2}$/;

export const createTransactionSchema = z.object({
  amount: z
    .string({ required_error: "Amount is required" })
    .regex(
      amountRegex,
      "Amount must be a numeric string with exactly two decimal places (e.g. 10.50)"
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
  currency: z.enum(["USD", "EUR", "GBP"], {
    errorMap: () => ({ message: "Currency must be USD, EUR, or GBP" }),
  }),
  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(1, "Description is required")
    .max(255, "Description must not exceed 255 characters"),
});

export type CreateTransactionFormData = z.infer<
  typeof createTransactionSchema
>;
