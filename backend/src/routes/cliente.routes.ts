import { Router } from "express";
import {
  criarClienteController,
  listarClientesController,
  buscarClienteController,
  atualizarClienteController,
  removerClienteController,
} from "../controllers/cliente.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/autorizar.middleware";
import { injetarTenant } from "../middlewares/tenant.middleware";

export const clienteRouter = Router();

clienteRouter.use(autenticar);

clienteRouter.get(
  "/",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  listarClientesController,
);

clienteRouter.get(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  buscarClienteController,
);

clienteRouter.post(
  "/",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  criarClienteController,
);

clienteRouter.put(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  atualizarClienteController,
);

clienteRouter.delete(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  removerClienteController,
);
