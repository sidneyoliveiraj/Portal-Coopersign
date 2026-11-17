import { Router } from "express";
import {
  criarServicoAdicionalController,
  listarServicosAdicionaisController,
  buscarServicoAdicionalController,
  atualizarServicoAdicionalController,
  removerServicoAdicionalController,
} from "../controllers/servico-adicional.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/autorizar.middleware";
import { injetarTenant } from "../middlewares/tenant.middleware";

export const servicoAdicionalRouter = Router();

servicoAdicionalRouter.use(autenticar);

servicoAdicionalRouter.get(
  "/",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  listarServicosAdicionaisController,
);

servicoAdicionalRouter.get(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  buscarServicoAdicionalController,
);

servicoAdicionalRouter.post(
  "/",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  criarServicoAdicionalController,
);

servicoAdicionalRouter.put(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  atualizarServicoAdicionalController,
);

servicoAdicionalRouter.delete(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  removerServicoAdicionalController,
);
