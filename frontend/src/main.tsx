import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { AuthProvider } from "./auth";
import { ConfirmacaoProvider } from "./confirmacao";
import { App } from "./App";
import { tema } from "./tema";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={tema}>
      <ConfirmacaoProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ConfirmacaoProvider>
    </MantineProvider>
  </StrictMode>,
);
