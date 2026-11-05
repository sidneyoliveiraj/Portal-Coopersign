import { type ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Anchor, Button, Container, Divider, Group, Loader, SimpleGrid, Table, Text, Title } from "@mantine/core";
import { api } from "../api";
import type { Pedido } from "../tipos";
import { FORMA_PAGAMENTO, formatarArea, formatarData, formatarMedidas, formatarMoeda, STATUS_PEDIDO } from "../formato";

function Campo({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {rotulo}
      </Text>
      <Text size="sm">{valor}</Text>
    </div>
  );
}

export function ComprovantePage() {
  const { id } = useParams();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api<{ pedido: Pedido }>(`/pedidos/${id}`)
      .then(({ pedido }) => setPedido(pedido))
      .catch((e) => setErro(e.message));
  }, [id]);

  if (erro) {
    return <Alert color="red">{erro}</Alert>;
  }
  if (!pedido) {
    return <Loader />;
  }

  const servicos = pedido.pedidoServicos ?? [];
  const ajustes = pedido.ajustesValor ?? [];

  return (
    <Container size="sm" py="lg">
      <style>{"@media print { .nao-imprimir { display: none !important; } }"}</style>

      <Group justify="space-between" mb="md" className="nao-imprimir">
        <Anchor component={Link} to={`/pedidos/${pedido.id}`} size="sm">
          Voltar para o pedido
        </Anchor>
        <Button onClick={() => window.print()}>Imprimir</Button>
      </Group>

      <Title order={3}>Comprovante de pedido</Title>
      <Text size="sm" c="dimmed" mb="md">
        Portal Coopersign
      </Text>

      <SimpleGrid cols={2} mb="md">
        <Campo rotulo="Cliente" valor={pedido.cliente.nome} />
        <Campo rotulo="Status" valor={STATUS_PEDIDO[pedido.status].rotulo} />
        <Campo rotulo="Data do pedido" valor={formatarData(pedido.criadoEm)} />
        <Campo rotulo="Prazo de entrega" valor={formatarData(pedido.prazoEntrega)} />
        {pedido.concluidoEm && <Campo rotulo="Concluído em" valor={formatarData(pedido.concluidoEm)} />}
        <Campo rotulo="Pagamento" valor={FORMA_PAGAMENTO[pedido.formaPagamento]} />
        <Campo rotulo="Material" valor={pedido.material.tipo} />
        <Campo rotulo="Dimensões" valor={formatarMedidas(pedido)} />
        <Campo rotulo="Metragem total" valor={formatarArea(pedido.metragemTotal)} />
        <Campo rotulo="Acabamento" valor={pedido.acabamento} />
      </SimpleGrid>
      <Campo rotulo="Arquivo de arte" valor={pedido.arquivoUrl} />

      <Divider my="md" />

      <Table>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Valor base ({formatarMoeda(pedido.material.precoM2)}/m²)</Table.Td>
            <Table.Td ta="right">{formatarMoeda(pedido.valorBase)}</Table.Td>
          </Table.Tr>
          {servicos.map((s) => (
            <Table.Tr key={s.id}>
              <Table.Td>
                {s.servicoAdicional.descricao} ({s.quantidade} × {formatarMoeda(s.valorUnitario)})
              </Table.Td>
              <Table.Td ta="right">{formatarMoeda(Number(s.valorUnitario) * s.quantidade)}</Table.Td>
            </Table.Tr>
          ))}
          {ajustes.map((a) => (
            <Table.Tr key={a.id}>
              <Table.Td>Ajuste: {a.descricao}</Table.Td>
              <Table.Td ta="right">{formatarMoeda(a.valor)}</Table.Td>
            </Table.Tr>
          ))}
          <Table.Tr>
            <Table.Td fw={700}>Valor total</Table.Td>
            <Table.Td ta="right" fw={700}>
              {formatarMoeda(pedido.valorTotal)}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Container>
  );
}
