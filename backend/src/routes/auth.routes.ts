import { Router } from "express";
import { cadastroClienteController, loginController, meController } from "../controllers/auth.controller";
import { autenticar } from "../middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/login", loginController);
authRouter.post("/cadastro", cadastroClienteController);
authRouter.get("/me", autenticar, meController);
