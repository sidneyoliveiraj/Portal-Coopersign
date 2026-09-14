import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { usuarioRouter } from "./routes/usuario.routes";

export const app = express();

const origensPermitidas = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(cors({ origin: origensPermitidas }));
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/usuarios", usuarioRouter);
