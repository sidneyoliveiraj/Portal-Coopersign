import { type ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Anchor, Badge, Group, Loader, Paper, SimpleGrid, Text, Title } from "@mantine/core";
import { api } from "../api";
import type { PedidoDoCliente } from "../tipos";
import {
  FORMA_PAGAMENTO,
  formatarData,
  formatarMedidas,
  formatarMetragem,
  formatarMoeda,
  formatarMomento,
  STATUS_PEDIDO,
} from "../formato";

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

export function MeuPedidoPage() {
  const { id } = useParams();
  const [pedido, setPedido] = useState<PedidoDoCliente | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api<{ pedido: PedidoDoCliente }>(`/portal/pedidos/${id}`)
      .then(({ pedido }) => setPedido(pedido))
      .catch((e) => setErro(e.message));
  }, [id]);

  if (erro) {
    return <Alert color="red">{erro}</Alert>;
  }
  if (!pedido) {
    return <Loader />;
  }

  const status = STATUS_PEDIDO[pedido.status];

  return (
    <>
      <Anchor component={Link} to="/meus-pedidos" size="sm">
        Voltar para meus pedidos
      </Anchor>

      <Group justify="space-between" mt="xs" mb="md">
        <Title order={3}>{pedido.material.tipo}</Title>
        <Badge color={status.cor} variant="light" size="lg">
          {status.rotulo}
        </Badge>
      </Group>

      <Paper withBorder p="md">
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
          <Campo rotulo="Medidas" valor={formatarMedidas(pedido)} />
          <Campo rotulo="Metragem total" valor={formatarMetragem(pedido)} />
          <Campo rotulo="Acabamento" valor={pedido.acabamento} />
          <Campo rotulo="Data de entrada" valor={formatarMomento(pedido.criadoEm)} />
          <Campo rotulo="Prazo de entrega" valor={formatarData(pedido.prazoEntrega)} />
          {pedido.concluidoEm && <Campo rotulo="Concluído em" valor={formatarMomento(pedido.concluidoEm)} />}
          <Campo rotulo="Pagamento" valor={FORMA_PAGAMENTO[pedido.formaPagamento]} />
          <Campo rotulo="Valor total" valor={formatarMoeda(pedido.valorTotal)} />
          {pedido.motivoRejeicao && <Campo rotulo="Motivo da rejeição" valor={pedido.motivoRejeicao} />}
        </SimpleGrid>
      </Paper>
    </>
  );
}
