import { Router } from "express";
import {
  cadastroClienteController,
  consultarLinkController,
  definirSenhaController,
  esqueciSenhaController,
  loginController,
  meController,
} from "../controllers/auth.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { limiteContas, limiteLogin } from "../lib/limites";

export const authRouter = Router();

authRouter.post("/login", limiteLogin, loginController);
authRouter.post("/cadastro", limiteContas, cadastroClienteController);
authRouter.get("/me", autenticar, meController);
authRouter.get("/link-senha", limiteContas, consultarLinkController);
authRouter.post("/definir-senha", limiteContas, definirSenhaController);
authRouter.post("/esqueci-senha", limiteContas, esqueciSenhaController);
