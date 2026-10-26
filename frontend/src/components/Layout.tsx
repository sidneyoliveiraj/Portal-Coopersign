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
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
