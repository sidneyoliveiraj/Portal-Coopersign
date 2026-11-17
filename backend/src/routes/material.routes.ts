import { Router } from "express";
import {
  criarMaterialController,
  listarMateriaisController,
  buscarMaterialController,
  atualizarMaterialController,
  removerMaterialController,
} from "../controllers/material.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/autorizar.middleware";
import { injetarTenant } from "../middlewares/tenant.middleware";

export const materialRouter = Router();

materialRouter.use(autenticar);

materialRouter.get(
  "/",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  listarMateriaisController,
);

materialRouter.get(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  buscarMaterialController,
);

materialRouter.post(
  "/",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  criarMaterialController,
);

materialRouter.put(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  atualizarMaterialController,
);

materialRouter.delete(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  removerMaterialController,
);
