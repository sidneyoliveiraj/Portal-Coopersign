import { Router } from "express";
import {
  atualizarUsuarioController,
  criarUsuarioController,
  listarUsuariosController,
} from "../controllers/usuario.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/autorizar.middleware";
import { injetarTenant } from "../middlewares/tenant.middleware";

export const usuarioRouter = Router();

usuarioRouter.use(autenticar, autorizar("ADMINISTRADOR", "GESTOR"), injetarTenant);

usuarioRouter.get("/", listarUsuariosController);
usuarioRouter.post("/", criarUsuarioController);
usuarioRouter.put("/:id", atualizarUsuarioController);
