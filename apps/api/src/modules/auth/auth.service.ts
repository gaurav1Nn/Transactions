import { Prisma } from "@prisma/client";
import { AuthRepository, authRepository } from "./auth.repository.js";
import { RegisterInput } from "./auth.schemas.js";
import { hashPassword } from "../../shared/password.js";
import { signAccessToken } from "../../shared/jwt.js";
import { AppError } from "../../shared/app-error.js";

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
}

export const authService = new AuthService();
