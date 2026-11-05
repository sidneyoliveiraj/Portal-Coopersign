import { NavLink as RouterLink, Outlet } from "react-router-dom";
import { AppShell, Button, Group, NavLink, Text } from "@mantine/core";
import { useAuth } from "../auth";

const PERFIS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  GESTOR: "Gestor",
  OPERADOR: "Operador",
  CLIENTE: "Cliente",
};

export function Layout() {
  const { usuario, sair } = useAuth();
  const podeCriar = usuario?.perfil === "ADMINISTRADOR" || usuario?.perfil === "GESTOR";

  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: "sm" }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Text fw={700}>Portal Coopersign</Text>
          <Group gap="sm">
            <Text size="sm" c="dimmed">
              {usuario && PERFIS[usuario.perfil]}
            </Text>
            <Button variant="default" size="xs" onClick={sair}>
              Sair
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <NavLink component={RouterLink} to="/pedidos" label="Pedidos" end />
        {podeCriar && <NavLink component={RouterLink} to="/pedidos/novo" label="Novo pedido" />}
        <NavLink component={RouterLink} to="/validacao" label="Validação técnica" />
        <NavLink component={RouterLink} to="/fila" label="Fila de produção" />
        {podeCriar && (
          <>
            <Text size="xs" c="dimmed" fw={600} mt="md" mb={4} px="sm">
              Cadastros
            </Text>
            <NavLink component={RouterLink} to="/cadastros/clientes" label="Clientes" />
            <NavLink component={RouterLink} to="/cadastros/materiais" label="Materiais" />
            <NavLink component={RouterLink} to="/cadastros/servicos" label="Serviços adicionais" />
            <NavLink component={RouterLink} to="/cadastros/maquinas" label="Máquinas" />
            <NavLink component={RouterLink} to="/cadastros/usuarios" label="Usuários" />
          </>
        )}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
