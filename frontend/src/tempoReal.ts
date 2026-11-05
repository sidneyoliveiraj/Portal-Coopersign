import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { lerToken } from "./api";

const URL_SERVIDOR = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api").replace(/\/api\/?$/, "");

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
