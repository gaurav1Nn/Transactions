import { Request, Response, NextFunction } from "express";
import { AuthService, authService } from "./auth.service.js";
import { revokeToken } from "../../shared/token-revocation.js";

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

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.headers.authorization!.slice(7).trim();
      await revokeToken(token);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
