import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Loader, Table, Text, Title } from "@mantine/core";
import { api } from "../api";
import { useAtualizacoesDePedidos } from "../tempoReal";
import type { PedidoDoCliente } from "../tipos";
import { formatarData, formatarMedidas, formatarMoeda, formatarMomento, STATUS_PEDIDO } from "../formato";

const STATUS_ENCERRADOS = ["CONCLUIDO", "FATURADO", "REJEITADO"];

function TabelaPedidos({ pedidos }: { pedidos: PedidoDoCliente[] }) {
  const navigate = useNavigate();

  return (
    <Table withTableBorder highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Entrada</Table.Th>
          <Table.Th>Material</Table.Th>
          <Table.Th>Medidas</Table.Th>
          <Table.Th>Prazo</Table.Th>
          <Table.Th ta="right">Valor</Table.Th>
          <Table.Th>Status</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {pedidos.map((pedido) => {
          const status = STATUS_PEDIDO[pedido.status];
          return (
            <Table.Tr key={pedido.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/meus-pedidos/${pedido.id}`)}>
              <Table.Td>{formatarMomento(pedido.criadoEm)}</Table.Td>
              <Table.Td>{pedido.material.tipo}</Table.Td>
              <Table.Td>{formatarMedidas(pedido)}</Table.Td>
              <Table.Td>{formatarData(pedido.prazoEntrega)}</Table.Td>
              <Table.Td ta="right">{formatarMoeda(pedido.valorTotal)}</Table.Td>
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
  );
}

export function MeusPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoDoCliente[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function carregar() {
    api<{ pedidos: PedidoDoCliente[] }>("/portal/pedidos")
      .then(({ pedidos }) => setPedidos(pedidos))
      .catch((e) => setErro(e.message));
  }

  useAtualizacoesDePedidos(carregar);

  useEffect(carregar, []);

  if (erro) {
    return <Alert color="red">{erro}</Alert>;
  }
  if (!pedidos) {
    return <Loader />;
  }

  const emAndamento = pedidos.filter((p) => !STATUS_ENCERRADOS.includes(p.status));
  const historico = pedidos.filter((p) => STATUS_ENCERRADOS.includes(p.status));

  return (
    <>
      <Title order={3} mb="md">
        Pedidos em andamento
      </Title>
      {emAndamento.length === 0 ? (
        <Text c="dimmed">Nenhum pedido em andamento.</Text>
      ) : (
        <TabelaPedidos pedidos={emAndamento} />
      )}

      <Title order={3} mt="xl" mb="md">
        Histórico
      </Title>
      {historico.length === 0 ? <Text c="dimmed">Nenhum pedido no histórico.</Text> : <TabelaPedidos pedidos={historico} />}
    </>
  );
}
