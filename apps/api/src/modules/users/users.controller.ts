import { Request, Response, NextFunction } from "express";
import { UsersService, usersService } from "./users.service.js";

export class UsersController {
  constructor(private service: UsersService = usersService) {}

  getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.service.getCurrentUser(userId);
      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const usersController = new UsersController();
