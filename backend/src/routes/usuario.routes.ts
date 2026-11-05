import { Router } from "express";
import {
  aprovarClienteController,
  atualizarUsuarioController,
  criarContaClienteController,
  listarContasClientesController,
  criarUsuarioController,
  listarUsuariosController,
} from "../controllers/usuario.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/autorizar.middleware";
import { injetarTenant } from "../middlewares/tenant.middleware";

export const usuarioRouter = Router();

usuarioRouter.use(autenticar, autorizar("ADMINISTRADOR", "GESTOR"), injetarTenant);

usuarioRouter.get("/clientes", listarContasClientesController);
usuarioRouter.post("/clientes", criarContaClienteController);
usuarioRouter.post("/:id/aprovar", aprovarClienteController);
usuarioRouter.get("/", listarUsuariosController);
usuarioRouter.post("/", criarUsuarioController);
usuarioRouter.put("/:id", atualizarUsuarioController);
