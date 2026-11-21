import { Server as ServidorHttp } from "node:http";
import { NextFunction, Request, Response } from "express";
import { Server } from "socket.io";
import { verificarToken } from "../services/auth.service";

export const EVENTO_PEDIDOS_ATUALIZADOS = "pedidos:atualizados";

let io: Server | null = null;

function salaDaOrganizacao(organizacaoId: string) {
  return `organizacao:${organizacaoId}`;
}

export function iniciarTempoReal(servidor: ServidorHttp, origensPermitidas: string[]) {
  io = new Server(servidor, { cors: { origin: origensPermitidas } });

  io.use((socket, proximo) => {
    try {
      socket.data.usuario = verificarToken(String(socket.handshake.auth.token));
      proximo();
    } catch {
      proximo(new Error("token invalido"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(salaDaOrganizacao(socket.data.usuario.organizacaoId));
  });
}

function emitirParaOrganizacao(organizacaoId: string) {
  io?.to(salaDaOrganizacao(organizacaoId)).emit(EVENTO_PEDIDOS_ATUALIZADOS);
}

export function criarNotificador(emitir: (organizacaoId: string) => void) {
  return (req: Request, res: Response, proximo: NextFunction) => {
    res.on("finish", () => {
      if (req.method !== "GET" && res.statusCode < 400 && req.usuario) {
        emitir(req.usuario.organizacaoId);
      }
    });
    proximo();
  };
}

export const notificarAlteracoes = criarNotificador(emitirParaOrganizacao);
