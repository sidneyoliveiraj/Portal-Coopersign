import { Navigate, Route, Routes } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "./auth";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { PedidosPage } from "./pages/PedidosPage";
import { NovoPedidoPage } from "./pages/NovoPedidoPage";
import { DetalhePedidoPage } from "./pages/DetalhePedidoPage";
import { ValidacaoPage } from "./pages/ValidacaoPage";
import { FilaPage } from "./pages/FilaPage";
import { FaturamentoPage } from "./pages/FaturamentoPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { ComprovantePage } from "./pages/ComprovantePage";
import { CadastroClientePage } from "./pages/CadastroClientePage";
import { MeusPedidosPage } from "./pages/MeusPedidosPage";
import { MeuPedidoPage } from "./pages/MeuPedidoPage";
import { ContasClientesPage } from "./pages/ContasClientesPage";
import { ClientesPage, MaquinasPage, MateriaisPage, ServicosPage, UsuariosPage } from "./pages/CadastrosPages";

export function App() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!usuario) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroClientePage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (usuario.perfil === "CLIENTE") {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route path="/meus-pedidos" element={<MeusPedidosPage />} />
          <Route path="/meus-pedidos/:id" element={<MeuPedidoPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/meus-pedidos" replace />} />
      </Routes>
    );
  }

  const podeCriar = usuario.perfil === "ADMINISTRADOR" || usuario.perfil === "GESTOR";

  return (
    <Routes>
      <Route path="/pedidos/:id/comprovante" element={<ComprovantePage />} />
      <Route element={<Layout />}>
        <Route path="/pedidos" element={<PedidosPage />} />
        {podeCriar && <Route path="/pedidos/novo" element={<NovoPedidoPage />} />}
        <Route path="/pedidos/:id" element={<DetalhePedidoPage />} />
        <Route path="/validacao" element={<ValidacaoPage />} />
        <Route path="/fila" element={<FilaPage />} />
        {podeCriar && (
          <>
            <Route path="/faturamento" element={<FaturamentoPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/cadastros/clientes" element={<ClientesPage />} />
            <Route path="/cadastros/materiais" element={<MateriaisPage />} />
            <Route path="/cadastros/servicos" element={<ServicosPage />} />
            <Route path="/cadastros/maquinas" element={<MaquinasPage />} />
            <Route path="/cadastros/usuarios" element={<UsuariosPage />} />
            <Route path="/cadastros/contas-clientes" element={<ContasClientesPage />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/pedidos" replace />} />
    </Routes>
  );
}
