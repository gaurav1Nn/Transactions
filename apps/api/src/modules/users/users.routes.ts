import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { usersController } from "./users.controller.js";

export const usersRouter = Router();

usersRouter.get("/me", authenticate, usersController.getMe);
