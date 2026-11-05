import { Router } from "express";
import {
  listarFilaController,
  atualizarStatusController,
  registrarRetrabalhoController,
  moverNaFilaController,
} from "../controllers/fila.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/autorizar.middleware";
import { injetarTenant } from "../middlewares/tenant.middleware";

export const filaRouter = Router();

filaRouter.use(autenticar);

filaRouter.get(
  "/maquinas/:maquinaId",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  listarFilaController,
);

filaRouter.post(
  "/pedidos/:id/status",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  atualizarStatusController,
);

filaRouter.post(
  "/pedidos/:id/retrabalho",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  registrarRetrabalhoController,
);

filaRouter.post(
  "/pedidos/:id/mover",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  moverNaFilaController,
);
