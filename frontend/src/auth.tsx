import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, lerToken, salvarToken } from "./api";

export type Perfil = "ADMINISTRADOR" | "GESTOR" | "OPERADOR" | "CLIENTE";

type Usuario = { usuarioId: string; organizacaoId: string; perfil: Perfil };

type ContextoAuth = {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
};

const AuthContext = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarUsuario() {
    try {
      const { usuario } = await api<{ usuario: Usuario }>("/auth/me");
      setUsuario(usuario);
    } catch {
      salvarToken(null);
      setUsuario(null);
    }
  }

  useEffect(() => {
    if (lerToken()) {
      carregarUsuario().finally(() => setCarregando(false));
    } else {
      setCarregando(false);
    }
  }, []);

  async function entrar(email: string, senha: string) {
    const { token } = await api<{ token: string }>("/auth/login", {
      metodo: "POST",
      corpo: { email, senha },
    });
    salvarToken(token);
    await carregarUsuario();
  }

  function sair() {
    salvarToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth precisa estar dentro de AuthProvider");
  }
  return contexto;
}
