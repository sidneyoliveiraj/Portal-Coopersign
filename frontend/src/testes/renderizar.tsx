// Monta o sistema inteiro (tema, rotas, login e janela de confirmação) numa rota escolhida.
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { App } from "../App";
import { AuthProvider, type Perfil } from "../auth";
import { ConfirmacaoProvider } from "../confirmacao";
import { tema } from "../tema";

export function renderizarApp(rota = "/") {
  const usuario = userEvent.setup();
  render(
    <MantineProvider theme={tema}>
      <ConfirmacaoProvider>
        <MemoryRouter initialEntries={[rota]}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      </ConfirmacaoProvider>
    </MantineProvider>,
  );
  return usuario;
}

/** Deixa um token salvo, como se a pessoa já tivesse entrado; a API falsa responde o "/auth/me". */
export function logado(perfil: Perfil) {
  localStorage.setItem("coopersign.token", "token-de-teste");
  return { "GET /auth/me": { usuario: { usuarioId: "u-1", organizacaoId: "org-1", perfil } } };
}
