import { Request, Response, NextFunction } from "express";
import { AuthService, authService } from "./auth.service.js";

export class AuthController {
  constructor(private service: AuthService = authService) {}

  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.service.register(req.body);
      res.status(201).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.service.login(req.body);
      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
