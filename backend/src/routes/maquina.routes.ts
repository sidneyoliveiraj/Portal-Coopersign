import { Router } from "express";
import {
  criarMaquinaController,
  listarMaquinasController,
  buscarMaquinaController,
  atualizarMaquinaController,
  removerMaquinaController,
} from "../controllers/maquina.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/autorizar.middleware";
import { injetarTenant } from "../middlewares/tenant.middleware";

export const maquinaRouter = Router();

maquinaRouter.use(autenticar);

maquinaRouter.get(
  "/",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  listarMaquinasController,
);

maquinaRouter.get(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  buscarMaquinaController,
);

maquinaRouter.post(
  "/",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  criarMaquinaController,
);

maquinaRouter.put(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  atualizarMaquinaController,
);

maquinaRouter.delete(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  removerMaquinaController,
);
