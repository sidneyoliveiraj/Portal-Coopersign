import { Router } from "express";
import { loginController, meController } from "../controllers/auth.controller";
import { autenticar } from "../middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/login", loginController);
authRouter.get("/me", autenticar, meController);
