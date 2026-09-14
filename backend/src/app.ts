import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { usuarioRouter } from "./routes/usuario.routes";
import { clienteRouter } from "./routes/cliente.routes";
import { maquinaRouter } from "./routes/maquina.routes";
import { materialRouter } from "./routes/material.routes";
import { servicoAdicionalRouter } from "./routes/servico-adicional.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/usuarios", usuarioRouter);
app.use("/api/clientes", clienteRouter);
app.use("/api/maquinas", maquinaRouter);
app.use("/api/materiais", materialRouter);
app.use("/api/servicos-adicionais", servicoAdicionalRouter);
