import { Router } from "express";
import {
  criarPedidoController,
  listarPedidosController,
  buscarPedidoController,
  ajustarValorPedidoController,
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
