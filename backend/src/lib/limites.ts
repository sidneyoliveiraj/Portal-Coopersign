import rateLimit from "express-rate-limit";

const MINUTO = 60 * 1000;

// Nos testes os limites ficam desligados; o limites.http.test.ts liga para conferir.
const desligado = () => process.env.LIMITES_DESLIGADOS === "1";

// Tentativas de senha por IP. Login certo nao conta, entao quem acerta nao fica preso.
export const limiteLogin = rateLimit({
  windowMs: 15 * MINUTO,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: desligado,
  message: { erro: "muitas tentativas de login, tente de novo em 15 minutos" },
});

// Cadastro, esqueci a senha e definir senha: evita spam de e-mail e chute de token.
export const limiteContas = rateLimit({
  windowMs: 15 * MINUTO,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: desligado,
  message: { erro: "muitas solicitacoes, tente de novo em alguns minutos" },
});
