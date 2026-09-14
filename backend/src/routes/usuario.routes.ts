import { Router } from "express";
import { listarUsuariosController } from "../controllers/usuario.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/autorizar.middleware";
import { injetarTenant } from "../middlewares/tenant.middleware";

export const usuarioRouter = Router();

usuarioRouter.get(
  "/",
  autenticar,
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  listarUsuariosController,
);
