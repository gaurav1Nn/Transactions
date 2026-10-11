import { z } from "zod";

const MAX_BCRYPT_PASSWORD_BYTES = 72;

export function utf8ByteLength(value: string): number {
  let bytes = 0;

  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);
    if (codePoint <= 0x7f) {
      bytes += 1;
    } else if (codePoint <= 0x7ff) {
      bytes += 2;
    } else if (
      codePoint >= 0xd800 &&
      codePoint <= 0xdbff &&
      value.charCodeAt(index + 1) >= 0xdc00 &&
      value.charCodeAt(index + 1) <= 0xdfff
    ) {
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }

  return bytes;
}

export const passwordCriteria = {
  minLength: (p: string) =>
    p.length >= 8 &&
    p.length <= 128 &&
    utf8ByteLength(p) <= MAX_BCRYPT_PASSWORD_BYTES,
  hasCase: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p),
  hasNumber: (p: string) => /\d/.test(p),
  hasSpecial: (p: string) => /[^a-zA-Z0-9]/.test(p),
};

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter your full name")
      .max(100, "Name must not exceed 100 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Enter your email address")
      .email("Enter a valid email address")
      .max(255, "Email must not exceed 255 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password must not exceed 128 characters")
      .refine(passwordCriteria.minLength, {
        message: `Password must not exceed ${MAX_BCRYPT_PASSWORD_BYTES} UTF-8 bytes`,
      })
      .refine(
        (p) =>
          passwordCriteria.hasCase(p) &&
          passwordCriteria.hasNumber(p) &&
          passwordCriteria.hasSpecial(p),
        {
          message:
            "Password must contain uppercase, lowercase, number, and special character",
        }
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
