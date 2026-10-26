import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ActionIcon,
  Alert,
  Button,
  Divider,
  Grid,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { api } from "../api";
import type { Cliente, Material, Pedido, ServicoAdicional } from "../tipos";
import { formatarArea, formatarMoeda } from "../formato";

type ItemServico = { servicoAdicionalId: string; quantidade: number };

export function NovoPedidoPage() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [servicos, setServicos] = useState<ServicoAdicional[]>([]);

  const [clienteId, setClienteId] = useState<string | null>(null);
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [largura, setLargura] = useState<number | string>("");
  const [altura, setAltura] = useState<number | string>("");
  const [quantidade, setQuantidade] = useState<number | string>(1);
  const [acabamento, setAcabamento] = useState("");
  const [arquivoUrl, setArquivoUrl] = useState("");
  const [prazoEntrega, setPrazoEntrega] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<string | null>("A_VISTA");
  const [itens, setItens] = useState<ItemServico[]>([]);
  const [servicoEscolhido, setServicoEscolhido] = useState<string | null>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ clientes: Cliente[] }>("/clientes"),
      api<{ materiais: Material[] }>("/materiais"),
      api<{ servicosAdicionais: ServicoAdicional[] }>("/servicos-adicionais"),
    ])
      .then(([c, m, s]) => {
        setClientes(c.clientes);
        setMateriais(m.materiais);
        setServicos(s.servicosAdicionais);
      })
      .catch((e) => setErro(e.message));
  }, []);

  const material = materiais.find((m) => m.id === materialId);

  const calculo = useMemo(() => {
    const l = Number(largura);
    const a = Number(altura);
    const q = Number(quantidade);
    const metragem = l > 0 && a > 0 && q > 0 ? l * a * q : 0;
    const valorBase = material ? metragem * Number(material.precoM2) : 0;
    const valorServicos = itens.reduce((soma, item) => {
      const servico = servicos.find((s) => s.id === item.servicoAdicionalId);
      return soma + (servico ? Number(servico.valorPadrao) * item.quantidade : 0);
    }, 0);
    return { metragem, valorBase, valorServicos, valorTotal: valorBase + valorServicos };
  }, [largura, altura, quantidade, material, itens, servicos]);

  function adicionarServico() {
    if (!servicoEscolhido || itens.some((i) => i.servicoAdicionalId === servicoEscolhido)) {
      return;
    }
    setItens([...itens, { servicoAdicionalId: servicoEscolhido, quantidade: 1 }]);
    setServicoEscolhido(null);
  }

  function alterarQuantidadeServico(id: string, valor: number | string) {
    setItens(itens.map((i) => (i.servicoAdicionalId === id ? { ...i, quantidade: Number(valor) || 1 } : i)));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const { pedido } = await api<{ pedido: Pedido }>("/pedidos", {
        metodo: "POST",
        corpo: {
          clienteId,
          materialId,
          largura,
          altura,
          quantidade,
          acabamento,
          arquivoUrl,
          prazoEntrega,
          formaPagamento,
          servicos: itens,
        },
      });
      navigate(`/pedidos/${pedido.id}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao salvar pedido");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar}>
      <Title order={3} mb="md">
        Novo pedido
      </Title>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack>
            {erro && <Alert color="red">{erro}</Alert>}

            <Select
              label="Cliente"
              placeholder="Selecione"
              searchable
              required
              data={clientes.map((c) => ({ value: c.id, label: c.nome }))}
              value={clienteId}
              onChange={setClienteId}
            />

            <Select
              label="Material"
              placeholder="Selecione"
              required
              data={materiais.map((m) => ({
                value: m.id,
                label: `${m.tipo} (${formatarMoeda(m.precoM2)}/m²)`,
              }))}
              value={materialId}
              onChange={setMaterialId}
            />

            <Group grow>
              <NumberInput
                label="Largura (m)"
                required
                min={0}
                decimalScale={2}
                decimalSeparator=","
                value={largura}
                onChange={setLargura}
              />
              <NumberInput
                label="Altura (m)"
                required
                min={0}
                decimalScale={2}
                decimalSeparator=","
                value={altura}
                onChange={setAltura}
              />
              <NumberInput
                label="Quantidade"
                required
                min={1}
                allowDecimal={false}
                value={quantidade}
                onChange={setQuantidade}
              />
            </Group>

            <TextInput
              label="Acabamento"
              placeholder="Ex: ilhós a cada 50 cm, bainha"
              required
              value={acabamento}
              onChange={(e) => setAcabamento(e.currentTarget.value)}
            />

            <TextInput
              label="Link do arquivo de arte"
              placeholder="https://"
              required
              value={arquivoUrl}
              onChange={(e) => setArquivoUrl(e.currentTarget.value)}
            />

            <Group grow>
              <TextInput
                label="Prazo de entrega"
                type="date"
                required
                value={prazoEntrega}
                onChange={(e) => setPrazoEntrega(e.currentTarget.value)}
              />
              <Select
                label="Forma de pagamento"
                data={[
                  { value: "A_VISTA", label: "À vista" },
                  { value: "EM_CONTA", label: "Em conta" },
                ]}
                value={formaPagamento}
                onChange={setFormaPagamento}
                allowDeselect={false}
              />
            </Group>

            <Divider label="Serviços adicionais" labelPosition="left" />

            <Group align="flex-end">
              <Select
                placeholder="Escolha um serviço"
                style={{ flex: 1 }}
                data={servicos
                  .filter((s) => !itens.some((i) => i.servicoAdicionalId === s.id))
                  .map((s) => ({ value: s.id, label: `${s.descricao} (${formatarMoeda(s.valorPadrao)})` }))}
                value={servicoEscolhido}
                onChange={setServicoEscolhido}
              />
              <Button variant="default" onClick={adicionarServico} disabled={!servicoEscolhido}>
                Adicionar
              </Button>
            </Group>

            {itens.length > 0 && (
              <Table>
                <Table.Tbody>
                  {itens.map((item) => {
                    const servico = servicos.find((s) => s.id === item.servicoAdicionalId);
                    return (
                      <Table.Tr key={item.servicoAdicionalId}>
                        <Table.Td>{servico?.descricao}</Table.Td>
                        <Table.Td w={110}>
                          <NumberInput
                            size="xs"
                            min={1}
                            allowDecimal={false}
                            value={item.quantidade}
                            onChange={(v) => alterarQuantidadeServico(item.servicoAdicionalId, v)}
                          />
                        </Table.Td>
                        <Table.Td ta="right">
                          {formatarMoeda(Number(servico?.valorPadrao ?? 0) * item.quantidade)}
                        </Table.Td>
                        <Table.Td w={40}>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Remover serviço"
                            onClick={() =>
                              setItens(itens.filter((i) => i.servicoAdicionalId !== item.servicoAdicionalId))
                            }
                          >
                            ×
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" pos="sticky" top={72}>
            <Text fw={600} mb="sm">
              Resumo
            </Text>
            <Stack gap={6}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Metragem
                </Text>
                <Text size="sm">{formatarArea(calculo.metragem)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Valor base
                </Text>
                <Text size="sm">{formatarMoeda(calculo.valorBase)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Serviços
                </Text>
                <Text size="sm">{formatarMoeda(calculo.valorServicos)}</Text>
              </Group>
              <Divider my={4} />
              <Group justify="space-between">
                <Text fw={600}>Total</Text>
                <Text fw={600}>{formatarMoeda(calculo.valorTotal)}</Text>
              </Group>
            </Stack>
            <Button type="submit" fullWidth mt="md" loading={enviando}>
              Registrar pedido
            </Button>
          </Paper>
        </Grid.Col>
      </Grid>
    </form>
  );
}
