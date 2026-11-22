import { useEffect } from "react";
import { NavLink as RouterLink, Outlet, useLocation } from "react-router-dom";
import { AppShell, Burger, Button, Group, NavLink, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAuth } from "../auth";
import { AMARELO_COOPERSIGN, AZUL_COOPERSIGN } from "../tema";
import { Logo } from "./Logo";

const PERFIS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  GESTOR: "Gestor",
  OPERADOR: "Operador",
  CLIENTE: "Cliente",
};

export function Layout() {
  const { usuario, sair } = useAuth();
  const podeCriar = usuario?.perfil === "ADMINISTRADOR" || usuario?.perfil === "GESTOR";
  // No celular o menu fica recolhido atras do botao e fecha ao trocar de pagina.
  const [menuAberto, menu] = useDisclosure(false);
  const { pathname } = useLocation();
  const fecharMenu = menu.close;
  useEffect(() => fecharMenu(), [pathname, fecharMenu]);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: "sm", collapsed: { mobile: !menuAberto } }}
      padding={{ base: "sm", sm: "lg" }}
    >
      <AppShell.Header style={{ background: AZUL_COOPERSIGN, borderBottom: `3px solid ${AMARELO_COOPERSIGN}` }}>
        <Group h="100%" px={{ base: "sm", sm: "lg" }} justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={menuAberto}
              onClick={menu.toggle}
              hiddenFrom="sm"
              size="sm"
              color="white"
              aria-label="Abrir o menu"
            />
            <Logo tamanho={36} />
            <Text fw={700} c="white" visibleFrom="xs">
              Portal Coopersign
            </Text>
          </Group>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm" c="white" visibleFrom="sm">
              {usuario && PERFIS[usuario.perfil]}
            </Text>
            <Button variant="white" size="xs" onClick={sair}>
              Sair
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm" style={{ overflowY: "auto" }}>
        {usuario?.perfil === "CLIENTE" ? (
          <NavLink component={RouterLink} to="/meus-pedidos" label="Meus pedidos" />
        ) : (
          <>
            <NavLink component={RouterLink} to="/pedidos" label="Pedidos" end />
            {podeCriar && <NavLink component={RouterLink} to="/pedidos/novo" label="Novo pedido" />}
            <NavLink component={RouterLink} to="/validacao" label="Validação técnica" />
            <NavLink component={RouterLink} to="/fila" label="Fila de produção" />
          </>
        )}
        {podeCriar && (
          <>
            <NavLink component={RouterLink} to="/faturamento" label="Fechamento de conta" />
            <NavLink component={RouterLink} to="/relatorios" label="Relatórios" />
            <Text size="xs" c="dimmed" fw={600} mt="md" mb={4} px="sm">
              Cadastros
            </Text>
            <NavLink component={RouterLink} to="/cadastros/clientes" label="Clientes" />
            <NavLink component={RouterLink} to="/cadastros/materiais" label="Materiais" />
            <NavLink component={RouterLink} to="/cadastros/servicos" label="Serviços adicionais" />
            <NavLink component={RouterLink} to="/cadastros/maquinas" label="Máquinas" />
            <NavLink component={RouterLink} to="/cadastros/usuarios" label="Usuários" />
            <NavLink component={RouterLink} to="/cadastros/contas-clientes" label="Contas de clientes" />
          </>
        )}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
