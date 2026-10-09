import { prisma } from "../../shared/prisma.js";
import { AppError } from "../../shared/app-error.js";
import { toUserDto, UserDto } from "../auth/auth.service.js";

export class UsersService {
  async getCurrentUser(userId: string): Promise<UserDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("NOT_FOUND", "User not found", 404);
    }

    return toUserDto(user);
  }
}

export const usersService = new UsersService();
