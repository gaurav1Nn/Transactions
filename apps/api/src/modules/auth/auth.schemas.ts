import { z } from "zod";

const MAX_BCRYPT_PASSWORD_BYTES = 72;

function hasRequiredPasswordComplexity(value: string): boolean {
  return (
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^a-zA-Z0-9]/.test(value)
  );
}

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters"),
    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .max(255, "Email must not exceed 255 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password must not exceed 128 characters")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= MAX_BCRYPT_PASSWORD_BYTES,
        `Password must not exceed ${MAX_BCRYPT_PASSWORD_BYTES} UTF-8 bytes`
      )
      .refine(
        hasRequiredPasswordComplexity,
        "Password must contain uppercase, lowercase, number, and special character"
      ),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
