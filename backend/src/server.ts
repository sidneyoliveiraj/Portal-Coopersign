import "dotenv/config";
import { createServer } from "node:http";
import { app, origensPermitidas } from "./app";
import { iniciarTempoReal } from "./lib/tempo-real";

const PORT = process.env.PORT || 3000;

const servidor = createServer(app);
iniciarTempoReal(servidor, origensPermitidas);

servidor.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
