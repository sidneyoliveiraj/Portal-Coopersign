import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { lerToken } from "./api";

// Em producao a API e relativa (/api): o tempo real conecta no proprio site.
export function enderecoDoServidor(apiUrl: string, origem: string) {
  return apiUrl.replace(/\/api\/?$/, "") || origem;
}

const URL_SERVIDOR = enderecoDoServidor(import.meta.env.VITE_API_URL ?? "http://localhost:3000/api", window.location.origin);

export function useAtualizacoesDePedidos(aoAtualizar: () => void) {
  const callback = useRef(aoAtualizar);
  callback.current = aoAtualizar;

  useEffect(() => {
    const socket = io(URL_SERVIDOR, { auth: { token: lerToken() } });
    socket.on("pedidos:atualizados", () => callback.current());
    return () => {
      socket.disconnect();
    };
  }, []);
}
