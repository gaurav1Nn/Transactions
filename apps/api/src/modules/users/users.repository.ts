import { User } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";

export class UsersRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }
}

export const usersRepository = new UsersRepository();
