import { Navigate, Route, Routes } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "./auth";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { PedidosPage } from "./pages/PedidosPage";
import { NovoPedidoPage } from "./pages/NovoPedidoPage";
import { DetalhePedidoPage } from "./pages/DetalhePedidoPage";

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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const podeCriar = usuario.perfil === "ADMINISTRADOR" || usuario.perfil === "GESTOR";

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/pedidos" element={<PedidosPage />} />
        {podeCriar && <Route path="/pedidos/novo" element={<NovoPedidoPage />} />}
        <Route path="/pedidos/:id" element={<DetalhePedidoPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/pedidos" replace />} />
    </Routes>
  );
}
