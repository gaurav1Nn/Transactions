import { UsersRepository, usersRepository } from "./users.repository.js";
import { AppError } from "../../shared/app-error.js";
import { toUserDto, UserDto } from "../auth/auth.service.js";

export class UsersService {
  constructor(private repo: UsersRepository = usersRepository) {}

  async getCurrentUser(userId: string): Promise<UserDto> {
    const user = await this.repo.findById(userId);

    if (!user) {
      throw new AppError("NOT_FOUND", "User not found", 404);
    }

    return toUserDto(user);
  }
}

export const usersService = new UsersService();
