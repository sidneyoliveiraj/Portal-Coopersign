import { Router } from "express";
import {
  contaAbertaController,
  fecharContaController,
  indicadoresController,
} from "../controllers/faturamento.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/autorizar.middleware";
import { injetarTenant } from "../middlewares/tenant.middleware";

export const faturamentoRouter = Router();

faturamentoRouter.use(autenticar, autorizar("ADMINISTRADOR", "GESTOR"), injetarTenant);

faturamentoRouter.get("/conta", contaAbertaController);
faturamentoRouter.post("/conta/fechar", fecharContaController);
faturamentoRouter.get("/indicadores", indicadoresController);
