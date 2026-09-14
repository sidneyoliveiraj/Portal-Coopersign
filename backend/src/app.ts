import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { usuarioRouter } from "./routes/usuario.routes";
import { clienteRouter } from "./routes/cliente.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/usuarios", usuarioRouter);
app.use("/api/clientes", clienteRouter);
