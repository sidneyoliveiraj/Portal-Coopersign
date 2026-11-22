import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { usuarioRouter } from "./routes/usuario.routes";
import { clienteRouter } from "./routes/cliente.routes";
import { maquinaRouter } from "./routes/maquina.routes";
import { materialRouter } from "./routes/material.routes";
import { servicoAdicionalRouter } from "./routes/servico-adicional.routes";
import { pedidoRouter } from "./routes/pedido.routes";
import { filaRouter } from "./routes/fila.routes";
import { faturamentoRouter } from "./routes/faturamento.routes";
import { portalRouter } from "./routes/portal.routes";
import { notificarAlteracoes } from "./lib/tempo-real";
import { expor, medirRequisicoes } from "./lib/metricas";

export const app = express();

// Em producao a requisicao passa pelo Caddy e pelo nginx (rede interna do Docker).
// Confiar so em proxies de IP privado faz o req.ip ser o do usuario, usado no limite de login.
app.set("trust proxy", "loopback, linklocal, uniquelocal");
app.disable("x-powered-by");

export const origensPermitidas = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: origensPermitidas }));
app.use(express.json({ limit: "100kb" }));
app.use(medirRequisicoes);

app.get("/metrics", expor);
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/usuarios", usuarioRouter);
app.use("/api/clientes", clienteRouter);
app.use("/api/maquinas", maquinaRouter);
app.use("/api/materiais", materialRouter);
app.use("/api/servicos-adicionais", servicoAdicionalRouter);
app.use("/api/pedidos", notificarAlteracoes, pedidoRouter);
app.use("/api/fila", notificarAlteracoes, filaRouter);
app.use("/api/faturamento", notificarAlteracoes, faturamentoRouter);
app.use("/api/portal", portalRouter);

app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const codigo = (erro as { code?: string }).code;
  if (codigo === "P2003") {
    return res.status(409).json({ erro: "registro em uso, nao pode ser removido" });
  }
  if (codigo === "P2002") {
    return res.status(409).json({ erro: "ja existe um registro com estes dados" });
  }
  console.error(erro);
  return res.status(500).json({ erro: "erro interno do servidor" });
});
