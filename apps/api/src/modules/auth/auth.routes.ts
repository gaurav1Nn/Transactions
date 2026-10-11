import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { registerSchema, loginSchema } from "./auth.schemas.js";
import { authController } from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate(registerSchema),
  authController.register
);

authRouter.post(
  "/login",
  validate(loginSchema),
  authController.login
);

authRouter.post("/logout", authenticate, authController.logout);
