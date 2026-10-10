import { Prisma } from "@prisma/client";
import { AuthRepository, authRepository } from "./auth.repository.js";
import { RegisterInput, LoginInput } from "./auth.schemas.js";
import { hashPassword, verifyPassword } from "../../shared/password.js";
import { signAccessToken } from "../../shared/jwt.js";
import { AppError } from "../../shared/app-error.js";

const DUMMY_HASH =
  "$2a$10$wK1k6iB7B9k6Xl9Kj0c8euKz6sY9Gf0B0kG6z5jW0iB7B9k6Xl9Kj";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponseData {
  user: UserDto;
  accessToken: string;
}

export function toUserDto(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  async register(input: RegisterInput): Promise<AuthResponseData> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await this.repo.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError(
        "EMAIL_EXISTS",
        "A user with this email address already exists",
        409
      );
    }

    const passwordHash = await hashPassword(input.password);

    try {
      const user = await this.repo.create({
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
      });

      const accessToken = signAccessToken(user.id);

      return {
        user: toUserDto(user),
        accessToken,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          "EMAIL_EXISTS",
          "A user with this email address already exists",
          409
        );
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthResponseData> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await this.repo.findByEmail(normalizedEmail);
    if (!user) {
      // Execute dummy timing-safe verification matching verifyPassword execution profile
      await verifyPassword(input.password, DUMMY_HASH);
      throw new AppError("UNAUTHORIZED", "Invalid email or password", 401);
    }
    const isMatch = await verifyPassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("UNAUTHORIZED", "Invalid email or password", 401);
    }

    const accessToken = signAccessToken(user.id);

    return {
      user: toUserDto(user),
      accessToken,
    };
  }
}

export const authService = new AuthService();
