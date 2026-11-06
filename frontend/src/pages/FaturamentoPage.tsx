import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Anchor, Button, Group, Paper, Select, Table, Text, TextInput, Title } from "@mantine/core";
import { api } from "../api";
import type { Cliente, Pedido } from "../tipos";
import { formatarMedidas, formatarMoeda, formatarMomento, inicioDoMes, hojeIso } from "../formato";

type Conta = { pedidos: Pedido[]; total: number };

export function FaturamentoPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [inicio, setInicio] = useState(inicioDoMes());
  const [fim, setFim] = useState(hojeIso());
  const [conta, setConta] = useState<Conta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [fechando, setFechando] = useState(false);

  useEffect(() => {
    api<{ clientes: Cliente[] }>("/clientes")
      .then(({ clientes }) => setClientes(clientes))
      .catch((e) => setErro(e.message));
  }, []);

  async function buscar(evento?: FormEvent) {
    evento?.preventDefault();
    setErro(null);
    setAviso(null);
    try {
      const parametros = new URLSearchParams({ clienteId: clienteId ?? "", inicio, fim });
      setConta(await api<Conta>(`/faturamento/conta?${parametros}`));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao buscar a conta");
    }
  }

  async function fechar() {
    if (!conta || !window.confirm(`Fechar a conta no valor de ${formatarMoeda(conta.total)}?`)) {
      return;
    }
    setErro(null);
    setFechando(true);
    try {
      const resultado = await api<{ quantidade: number; total: number }>("/faturamento/conta/fechar", {
        metodo: "POST",
        corpo: { clienteId, inicio, fim },
      });
      setConta(null);
      setAviso(`Conta fechada: ${resultado.quantidade} pedido(s), total de ${formatarMoeda(resultado.total)}.`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao fechar a conta");
    } finally {
      setFechando(false);
    }
  }

  return (
    <>
      <Title order={3} mb="md">
        Fechamento de conta
      </Title>

      <Paper withBorder p="md" mb="md">
        <form onSubmit={buscar}>
          <Group align="flex-end">
            <Select
              label="Cliente"
              placeholder="Selecione"
              searchable
              required
              style={{ flex: 1 }}
              data={clientes.map((c) => ({ value: c.id, label: c.nome }))}
              value={clienteId}
              onChange={setClienteId}
            />
            <TextInput label="De" type="date" required value={inicio} onChange={(e) => setInicio(e.currentTarget.value)} />
            <TextInput label="Até" type="date" required value={fim} onChange={(e) => setFim(e.currentTarget.value)} />
            <Button type="submit" disabled={!clienteId}>
              Ver conta
            </Button>
          </Group>
        </form>
      </Paper>

      {erro && (
        <Alert color="red" mb="md">
          {erro}
        </Alert>
      )}
      {aviso && (
        <Alert color="green" mb="md">
          {aviso}
        </Alert>
      )}

      {conta?.pedidos.length === 0 && <Text c="dimmed">Nenhum pedido em conta concluído neste período.</Text>}

      {conta && conta.pedidos.length > 0 && (
        <>
          <Table withTableBorder mb="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Concluído em</Table.Th>
                <Table.Th>Material</Table.Th>
                <Table.Th>Medidas</Table.Th>
                <Table.Th ta="right">Valor</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {conta.pedidos.map((pedido) => (
                <Table.Tr key={pedido.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/pedidos/${pedido.id}`} size="sm">
                      {pedido.concluidoEm ? formatarMomento(pedido.concluidoEm) : "—"}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{pedido.material.tipo}</Table.Td>
                  <Table.Td>{formatarMedidas(pedido)}</Table.Td>
                  <Table.Td ta="right">{formatarMoeda(pedido.valorTotal)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Group justify="space-between">
            <Text fw={600}>Total: {formatarMoeda(conta.total)}</Text>
            <Button loading={fechando} onClick={fechar}>
              Fechar conta
            </Button>
          </Group>
        </>
      )}
    </>
  );
}
