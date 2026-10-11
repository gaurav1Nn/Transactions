import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(14).default(10),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGINS: z
    .string()
    .default("*")
    .transform((val) => val.split(",").map((s) => s.trim())),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(input: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const sanitizedErrors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    const message = `Invalid environment configuration:\n${sanitizedErrors
      .map((e) => `  - ${e.field}: ${e.message}`)
      .join("\n")}`;

    throw new Error(message);
  }

  return result.data;
}

let cachedEnv: Env | null = null;

function getCachedEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = parseEnv(process.env);
  }
  return cachedEnv;
}

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string | symbol) {
    return getCachedEnv()[prop as keyof Env];
  },
  has(_target, prop: string | symbol) {
    return Reflect.has(getCachedEnv(), prop);
  },
  ownKeys() {
    return Reflect.ownKeys(getCachedEnv());
  },
  getOwnPropertyDescriptor(_target, prop: string | symbol) {
    return Object.getOwnPropertyDescriptor(getCachedEnv(), prop);
  },
  set() {
    throw new Error("Configuration is immutable at runtime");
  },
});
