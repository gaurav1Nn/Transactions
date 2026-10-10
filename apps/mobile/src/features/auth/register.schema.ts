import { z } from "zod";

export const passwordCriteria = {
  minLength: (p: string) => p.length >= 8 && p.length <= 128,
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
