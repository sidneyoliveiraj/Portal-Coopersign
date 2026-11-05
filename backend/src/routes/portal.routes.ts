import { Router } from "express";
import { buscarMeuPedidoController, listarMeusPedidosController } from "../controllers/portal.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/autorizar.middleware";
import { injetarTenant } from "../middlewares/tenant.middleware";

export const portalRouter = Router();

portalRouter.use(autenticar, autorizar("CLIENTE"), injetarTenant);

portalRouter.get("/pedidos", listarMeusPedidosController);
portalRouter.get("/pedidos/:id", buscarMeuPedidoController);
