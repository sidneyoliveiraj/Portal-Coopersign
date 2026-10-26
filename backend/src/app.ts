import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.routes";

export const app = express();

const origensPermitidas = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(cors({ origin: origensPermitidas }));
app.use(express.json());

app.use("/api/health", healthRouter);
