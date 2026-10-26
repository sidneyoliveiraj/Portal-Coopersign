import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Group, Loader, Table, Text, Title } from "@mantine/core";
import { api } from "../api";
import { useAuth } from "../auth";
import type { Pedido } from "../tipos";
import { formatarArea, formatarData, formatarMoeda, STATUS_PEDIDO } from "../formato";

export function PedidosPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api<{ pedidos: Pedido[] }>("/pedidos")
      .then(({ pedidos }) => setPedidos(pedidos))
      .catch((e) => setErro(e.message));
  }, []);

  const podeCriar = usuario?.perfil === "ADMINISTRADOR" || usuario?.perfil === "GESTOR";

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
        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>Material</Table.Th>
              <Table.Th ta="right">Metragem</Table.Th>
              <Table.Th ta="right">Valor total</Table.Th>
              <Table.Th>Prazo</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pedidos.map((pedido) => {
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
                  <Table.Td>{formatarData(pedido.prazoEntrega)}</Table.Td>
                  <Table.Td>
                    <Badge color={status.cor} variant="light">
                      {status.rotulo}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}
    </>
  );
}
