import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Grid,
  Group,
  Loader,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { api } from "../api";
import { useAuth } from "../auth";
import type { Pedido } from "../tipos";
import { FORMA_PAGAMENTO, formatarArea, formatarData, formatarMoeda, STATUS_PEDIDO } from "../formato";

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

export function DetalhePedidoPage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [valorAjuste, setValorAjuste] = useState<number | string>("");
  const [justificativa, setJustificativa] = useState("");
  const [erroAjuste, setErroAjuste] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api<{ pedido: Pedido }>(`/pedidos/${id}`)
      .then(({ pedido }) => setPedido(pedido))
      .catch((e) => setErro(e.message));
  }, [id]);

  async function registrarAjuste(evento: FormEvent) {
    evento.preventDefault();
    setErroAjuste(null);
    setSalvando(true);
    try {
      const resposta = await api<{ pedido: Pedido }>(`/pedidos/${id}/ajustes`, {
        metodo: "POST",
        corpo: { valor: valorAjuste, justificativa },
      });
      setPedido(resposta.pedido);
      setValorAjuste("");
      setJustificativa("");
    } catch (e) {
      setErroAjuste(e instanceof Error ? e.message : "erro ao registrar ajuste");
    } finally {
      setSalvando(false);
    }
  }

  if (erro) {
    return <Alert color="red">{erro}</Alert>;
  }
  if (!pedido) {
    return <Loader />;
  }

  const status = STATUS_PEDIDO[pedido.status];
  const podeAjustar =
    (usuario?.perfil === "ADMINISTRADOR" || usuario?.perfil === "GESTOR") && pedido.status !== "FATURADO";
  const servicos = pedido.pedidoServicos ?? [];
  const ajustes = pedido.ajustesValor ?? [];

  return (
    <>
      <Anchor component={Link} to="/pedidos" size="sm">
        Voltar para pedidos
      </Anchor>

      <Group justify="space-between" mt="xs" mb="md">
        <Title order={3}>Pedido de {pedido.cliente.nome}</Title>
        <Badge color={status.cor} variant="light" size="lg">
          {status.rotulo}
        </Badge>
      </Group>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack>
            <Paper withBorder p="md">
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
                <Campo rotulo="Material" valor={pedido.material.tipo} />
                <Campo
                  rotulo="Dimensões"
                  valor={`${Number(pedido.largura).toLocaleString("pt-BR")} × ${Number(pedido.altura).toLocaleString("pt-BR")} m`}
                />
                <Campo rotulo="Quantidade" valor={pedido.quantidade} />
                <Campo rotulo="Acabamento" valor={pedido.acabamento} />
                <Campo rotulo="Prazo de entrega" valor={formatarData(pedido.prazoEntrega)} />
                <Campo rotulo="Pagamento" valor={FORMA_PAGAMENTO[pedido.formaPagamento]} />
                <Campo
                  rotulo="Arquivo de arte"
                  valor={
                    <Anchor href={pedido.arquivoUrl} target="_blank" rel="noreferrer" size="sm">
                      Abrir arquivo
                    </Anchor>
                  }
                />
              </SimpleGrid>
            </Paper>

            {servicos.length > 0 && (
              <Paper withBorder p="md">
                <Text fw={600} mb="xs">
                  Serviços adicionais
                </Text>
                <Table>
                  <Table.Tbody>
                    {servicos.map((s) => (
                      <Table.Tr key={s.id}>
                        <Table.Td>{s.servicoAdicional.descricao}</Table.Td>
                        <Table.Td>{s.quantidade} ×</Table.Td>
                        <Table.Td ta="right">{formatarMoeda(Number(s.valorUnitario) * s.quantidade)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}

            <Paper withBorder p="md">
              <Text fw={600} mb="xs">
                Ajustes de valor
              </Text>
              {ajustes.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Nenhum ajuste registrado.
                </Text>
              ) : (
                <Table>
                  <Table.Tbody>
                    {ajustes.map((a) => (
                      <Table.Tr key={a.id}>
                        <Table.Td>{formatarData(a.criadoEm)}</Table.Td>
                        <Table.Td>{a.descricao}</Table.Td>
                        <Table.Td ta="right" c={Number(a.valor) < 0 ? "red" : undefined}>
                          {formatarMoeda(a.valor)}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}

              {podeAjustar && (
                <form onSubmit={registrarAjuste}>
                  <Stack mt="md" gap="sm">
                    {erroAjuste && <Alert color="red">{erroAjuste}</Alert>}
                    <Group align="flex-end" grow>
                      <NumberInput
                        label="Valor (negativo para desconto)"
                        required
                        decimalScale={2}
                        decimalSeparator=","
                        value={valorAjuste}
                        onChange={setValorAjuste}
                      />
                      <TextInput
                        label="Justificativa"
                        required
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.currentTarget.value)}
                      />
                    </Group>
                    <Group justify="flex-end">
                      <Button type="submit" variant="default" loading={salvando}>
                        Registrar ajuste
                      </Button>
                    </Group>
                  </Stack>
                </form>
              )}
            </Paper>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md">
            <Stack gap={6}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Metragem
                </Text>
                <Text size="sm">{formatarArea(pedido.metragemTotal)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Valor base
                </Text>
                <Text size="sm">{formatarMoeda(pedido.valorBase)}</Text>
              </Group>
              <Group justify="space-between" pt={4} style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}>
                <Text fw={600}>Total</Text>
                <Text fw={600}>{formatarMoeda(pedido.valorTotal)}</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </>
  );
}
