import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  MultiSelect,
  Paper,
  Select,
  SimpleGrid,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { api } from "../api";
import { FILTRO_VAZIO, type FiltroPedidos, filtrarPedidos, filtroAtivo, teveRetrabalho } from "../filtroPedidos";
import { useAtualizacoesDePedidos } from "../tempoReal";
import { useAuth } from "../auth";
import type { Pedido } from "../tipos";
import { formatarArea, formatarData, formatarMoeda, formatarMomento, STATUS_PEDIDO } from "../formato";

export function PedidosPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function carregar() {
    api<{ pedidos: Pedido[] }>("/pedidos")
      .then(({ pedidos }) => setPedidos(pedidos))
      .catch((e) => setErro(e.message));
  }

  useAtualizacoesDePedidos(carregar);

  useEffect(carregar, []);

  const podeCriar = usuario?.perfil === "ADMINISTRADOR" || usuario?.perfil === "GESTOR";

  const [filtro, setFiltro] = useState<FiltroPedidos>(FILTRO_VAZIO);
  const alterarFiltro = (parcial: Partial<FiltroPedidos>) => setFiltro((atual) => ({ ...atual, ...parcial }));

  // Clientes que aparecem nos pedidos, em ordem alfabética, para o filtro.
  const opcoesClientes = useMemo(() => {
    const nomes = new Map<string, string>();
    pedidos?.forEach((p) => nomes.set(p.cliente.id, p.cliente.nome));
    return [...nomes].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [pedidos]);

  const visiveis = useMemo(() => (pedidos ? filtrarPedidos(pedidos, filtro) : []), [pedidos, filtro]);

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={3}>Pedidos</Title>
        {podeCriar && (
          <Button component={Link} to="/pedidos/novo">
            Novo pedido
          </Button>
        )}
      </Group>

      {erro && <Alert color="red">{erro}</Alert>}
      {!pedidos && !erro && <Loader />}
      {pedidos?.length === 0 && <Text c="dimmed">Nenhum pedido cadastrado ainda.</Text>}

      {pedidos && pedidos.length > 0 && (
        <Paper withBorder p="sm" mb="md">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
            <MultiSelect
              label="Status"
              placeholder={filtro.status.length === 0 ? "Todos" : undefined}
              data={Object.entries(STATUS_PEDIDO).map(([value, s]) => ({ value, label: s.rotulo }))}
              value={filtro.status}
              onChange={(status) => alterarFiltro({ status })}
              clearable
            />
            <Select
              label="Cliente"
              placeholder="Todos"
              data={opcoesClientes}
              value={filtro.clienteId}
              onChange={(clienteId) => alterarFiltro({ clienteId })}
              searchable
              clearable
            />
            <TextInput
              label="Entrada de"
              type="date"
              value={filtro.inicio}
              onChange={(e) => alterarFiltro({ inicio: e.currentTarget.value })}
            />
            <TextInput
              label="Entrada até"
              type="date"
              value={filtro.fim}
              onChange={(e) => alterarFiltro({ fim: e.currentTarget.value })}
            />
          </SimpleGrid>
          <Group justify="space-between" mt="sm">
            <Text size="sm" c="dimmed">
              {visiveis.length} de {pedidos.length} pedido(s)
            </Text>
            {filtroAtivo(filtro) && (
              <Button variant="subtle" size="xs" onClick={() => setFiltro(FILTRO_VAZIO)}>
                Limpar filtros
              </Button>
            )}
          </Group>
        </Paper>
      )}

      {pedidos && pedidos.length > 0 && visiveis.length === 0 && (
        <Text c="dimmed">Nenhum pedido com esses filtros.</Text>
      )}

      {visiveis.length > 0 && (
        <Table.ScrollContainer minWidth={640}>
          <Table highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Material</Table.Th>
                <Table.Th ta="right">Metragem</Table.Th>
                <Table.Th ta="right">Valor total</Table.Th>
                <Table.Th>Entrada</Table.Th>
                <Table.Th>Prazo</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visiveis.map((pedido) => {
                const status = STATUS_PEDIDO[pedido.status];
                return (
                  <Table.Tr
                    key={pedido.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/pedidos/${pedido.id}`)}
                  >
                    <Table.Td>{pedido.cliente.nome}</Table.Td>
                    <Table.Td>{pedido.material.tipo}</Table.Td>
                    <Table.Td ta="right">{formatarArea(pedido.metragemTotal)}</Table.Td>
                    <Table.Td ta="right">{formatarMoeda(pedido.valorTotal)}</Table.Td>
                    <Table.Td>{formatarMomento(pedido.criadoEm)}</Table.Td>
                    <Table.Td>{formatarData(pedido.prazoEntrega)}</Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Badge color={status.cor} variant="light">
                          {status.rotulo}
                        </Badge>
                        {teveRetrabalho(pedido) && pedido.status !== "RETRABALHO" && (
                          <Badge color="orange" variant="outline" title="Este pedido já teve retrabalho">
                            Retrabalho
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </>
  );
}
