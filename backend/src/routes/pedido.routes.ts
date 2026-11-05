import { Router } from "express";
import {
  criarPedidoController,
  listarPedidosController,
  buscarPedidoController,
  ajustarValorPedidoController,
  listarPendentesValidacaoController,
  aprovarPedidoController,
  rejeitarPedidoController,
} from "../controllers/pedido.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/autorizar.middleware";
import { injetarTenant } from "../middlewares/tenant.middleware";

export const pedidoRouter = Router();

pedidoRouter.use(autenticar);

pedidoRouter.get(
  "/",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  listarPedidosController,
);

pedidoRouter.get(
  "/validacao",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  listarPendentesValidacaoController,
);

pedidoRouter.post(
  "/:id/aprovar",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  aprovarPedidoController,
);

pedidoRouter.post(
  "/:id/rejeitar",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  rejeitarPedidoController,
);

pedidoRouter.get(
  "/:id",
  autorizar("ADMINISTRADOR", "GESTOR", "OPERADOR"),
  injetarTenant,
  buscarPedidoController,
);

pedidoRouter.post(
  "/",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  criarPedidoController,
);

pedidoRouter.post(
  "/:id/ajustes",
  autorizar("ADMINISTRADOR", "GESTOR"),
  injetarTenant,
  ajustarValorPedidoController,
);
