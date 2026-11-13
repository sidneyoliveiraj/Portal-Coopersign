import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { BarChart, DonutChart } from "@mantine/charts";
import { api } from "../api";
import type { Pedido } from "../tipos";
import {
  type AtalhoPeriodo,
  FORMA_PAGAMENTO,
  formatarArea,
  formatarData,
  formatarMoeda,
  formatarMomento,
  hojeIso,
  nomeDoMes,
  periodoDoAtalho,
} from "../formato";
import { AMARELO_COOPERSIGN, AZUL_COOPERSIGN } from "../tema";

type RetrabalhoDoPeriodo = {
  id: string;
  pedidoId: string;
  data: string;
  cliente: string;
  material: string;
  motivo: string;
  custo: number;
};

type LinhaMes = { pedidos: number; metragem: number; metragemCobrada: number; receita: number };

type Indicadores = {
  receitaTotal: number;
  receitaPorForma: { A_VISTA: number; EM_CONTA: number };
  pedidosConcluidos: number;
  pedidosPorMaquina: { maquina: string; quantidade: number }[];
  pedidosPorMaterial: { material: string; quantidade: number; metragem: number }[];
  taxaRetrabalho: number | null;
  tempoMedioHoras: number | null;
  custoRetrabalho: number;
  retrabalhos: RetrabalhoDoPeriodo[];
  porMes: { meses: (LinhaMes & { mes: string })[]; total: LinhaMes };
  pedidos: Pedido[];
};

const ESTILO_IMPRESSAO = `
  .so-impressao { display: none; }
  @media print {
    .nao-imprimir, .mantine-AppShell-header, .mantine-AppShell-navbar { display: none !important; }
    .so-impressao { display: block !important; }
    .mantine-AppShell-main { padding: 0 !important; min-height: 0 !important; }
    .quebra-antes { break-before: page; }
  }
`;

const ATALHOS = [
  { value: "mes", label: "Este mês" },
  { value: "mesPassado", label: "Mês passado" },
  { value: "ano", label: "Este ano" },
  { value: "personalizado", label: "Personalizado" },
];

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text size="xs" c="dimmed">
        {rotulo}
      </Text>
      <Text size="xl" fw={700} c="coopersign.7">
        {valor}
      </Text>
      <Text size="xs" c="dimmed" h={18}>
        {detalhe}
      </Text>
      <Box
        mt="xs"
        h={3}
        style={{ borderRadius: 2, background: `linear-gradient(90deg, ${AZUL_COOPERSIGN}, ${AMARELO_COOPERSIGN})` }}
      />
    </Paper>
  );
}

function Quadro({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <Paper withBorder p="md" radius="md" className={className}>
      <Text fw={600} mb="sm">
        {titulo}
      </Text>
      {children}
    </Paper>
  );
}

function porcentagem(parte: number, total: number) {
  return total > 0 ? `${Math.round((parte / total) * 100)}%` : "0%";
}

export function RelatoriosPage() {
  const [atalho, setAtalho] = useState("mes");
  const [inicio, setInicio] = useState(periodoDoAtalho("mes", hojeIso()).inicio);
  const [fim, setFim] = useState(hojeIso());
  const [periodoCarregado, setPeriodoCarregado] = useState({ inicio, fim });
  const [dados, setDados] = useState<Indicadores | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (de: string, ate: string) => {
    setErro(null);
    try {
      setDados(await api<Indicadores>(`/faturamento/indicadores?${new URLSearchParams({ inicio: de, fim: ate })}`));
      setPeriodoCarregado({ inicio: de, fim: ate });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao carregar os indicadores");
    }
  }, []);

  useEffect(() => {
    const { inicio: de, fim: ate } = periodoDoAtalho("mes", hojeIso());
    carregar(de, ate);
  }, [carregar]);

  function escolherAtalho(valor: string) {
    setAtalho(valor);
    if (valor === "personalizado") {
      return;
    }
    const periodo = periodoDoAtalho(valor as AtalhoPeriodo, hojeIso());
    setInicio(periodo.inicio);
    setFim(periodo.fim);
    carregar(periodo.inicio, periodo.fim);
  }

  function filtrar(evento: FormEvent) {
    evento.preventDefault();
    carregar(inicio, fim);
  }

  const formas = dados
    ? [
        { name: "À vista", value: dados.receitaPorForma.A_VISTA, color: "coopersign.6" },
        { name: "Em conta", value: dados.receitaPorForma.EM_CONTA, color: "yellow.5" },
      ]
    : [];

  return (
    <>
      <style>{ESTILO_IMPRESSAO}</style>

      <Box className="so-impressao" mb="md">
        <Text fw={700} size="lg">
          Coopersign · Relatório de produção e receita
        </Text>
        <Text size="sm">
          Período: {formatarData(periodoCarregado.inicio)} a {formatarData(periodoCarregado.fim)}
        </Text>
      </Box>

      <Stack gap="sm" mb="md" className="nao-imprimir">
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={3}>Relatórios</Title>
            <Text size="sm" c="dimmed">
              Receita e metros quadrados dos pedidos concluídos
            </Text>
          </div>
          <Button variant="default" onClick={() => window.print()} disabled={!dados}>
            Imprimir relatório
          </Button>
        </Group>
        <Group align="flex-end" justify="space-between">
          <SegmentedControl data={ATALHOS} value={atalho} onChange={escolherAtalho} />
          <form onSubmit={filtrar}>
            <Group align="flex-end" gap="xs">
              <TextInput
                label="De"
                type="date"
                required
                value={inicio}
                onChange={(e) => {
                  setInicio(e.currentTarget.value);
                  setAtalho("personalizado");
                }}
              />
              <TextInput
                label="Até"
                type="date"
                required
                value={fim}
                onChange={(e) => {
                  setFim(e.currentTarget.value);
                  setAtalho("personalizado");
                }}
              />
              <Button type="submit" variant="default">
                Filtrar
              </Button>
            </Group>
          </form>
        </Group>
      </Stack>

      {erro && (
        <Alert color="red" mb="md">
          {erro}
        </Alert>
      )}
      {!dados && !erro && <Loader />}

      {dados && (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 2, md: 3, xl: 6 }}>
            <Indicador rotulo="Receita total" valor={formatarMoeda(dados.receitaTotal)} />
            <Indicador
              rotulo="m² rodados"
              valor={formatarArea(dados.porMes.total.metragem)}
              detalhe={`${formatarArea(dados.porMes.total.metragemCobrada)} cobrados`}
            />
            <Indicador rotulo="Pedidos concluídos" valor={String(dados.pedidosConcluidos)} />
            <Indicador
              rotulo="Taxa de retrabalho"
              valor={dados.taxaRetrabalho === null ? "—" : `${dados.taxaRetrabalho.toLocaleString("pt-BR")}%`}
              detalhe="Retrabalhos por pedido concluído"
            />
            <Indicador
              rotulo="Tempo médio de produção"
              valor={dados.tempoMedioHoras === null ? "—" : `${dados.tempoMedioHoras.toLocaleString("pt-BR")} h`}
              detalhe="Do início à conclusão"
            />
            <Indicador
              rotulo="Gasto com retrabalho"
              valor={formatarMoeda(dados.custoRetrabalho)}
              detalhe={`${dados.retrabalhos.length} retrabalho(s)`}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 3 }}>
            <Box style={{ gridColumn: "span 2" }}>
              <Quadro titulo="Receita por mês">
                <BarChart
                  h={240}
                  data={dados.porMes.meses.map((m) => ({ mes: nomeDoMes(m.mes, true), receita: m.receita }))}
                  dataKey="mes"
                  series={[{ name: "receita", label: "Receita", color: "coopersign.6" }]}
                  valueFormatter={(valor) => formatarMoeda(valor)}
                  tickLine="y"
                  gridAxis="y"
                />
              </Quadro>
            </Box>
            <Quadro titulo="Receita por forma de pagamento">
              <Group justify="center" mb="sm">
                <DonutChart
                  data={formas}
                  size={150}
                  thickness={26}
                  valueFormatter={(valor) => formatarMoeda(valor)}
                  withTooltip={dados.receitaTotal > 0}
                />
              </Group>
              <Stack gap={4}>
                {formas.map((forma) => (
                  <Group key={forma.name} justify="space-between" wrap="nowrap">
                    <Group gap={6} wrap="nowrap">
                      <Box
                        w={10}
                        h={10}
                        style={{
                          borderRadius: "50%",
                          background: forma.name === "À vista" ? AZUL_COOPERSIGN : "var(--mantine-color-yellow-5)",
                        }}
                      />
                      <Text size="sm">
                        {forma.name} · {porcentagem(forma.value, dados.receitaTotal)}
                      </Text>
                    </Group>
                    <Text size="sm" fw={500}>
                      {formatarMoeda(forma.value)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Quadro>
          </SimpleGrid>

          <Quadro titulo="Mês a mês">
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Mês</Table.Th>
                  <Table.Th ta="right">Pedidos</Table.Th>
                  <Table.Th ta="right">m² rodados</Table.Th>
                  <Table.Th ta="right">m² cobrados</Table.Th>
                  <Table.Th ta="right">Receita</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {dados.porMes.meses.map((linha) => (
                  <Table.Tr key={linha.mes}>
                    <Table.Td>{nomeDoMes(linha.mes)}</Table.Td>
                    <Table.Td ta="right">{linha.pedidos}</Table.Td>
                    <Table.Td ta="right">{formatarArea(linha.metragem)}</Table.Td>
                    <Table.Td ta="right">{formatarArea(linha.metragemCobrada)}</Table.Td>
                    <Table.Td ta="right">{formatarMoeda(linha.receita)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr>
                  <Table.Th>Total do período</Table.Th>
                  <Table.Th ta="right">{dados.porMes.total.pedidos}</Table.Th>
                  <Table.Th ta="right">{formatarArea(dados.porMes.total.metragem)}</Table.Th>
                  <Table.Th ta="right">{formatarArea(dados.porMes.total.metragemCobrada)}</Table.Th>
                  <Table.Th ta="right">{formatarMoeda(dados.porMes.total.receita)}</Table.Th>
                </Table.Tr>
              </Table.Tfoot>
            </Table>
            <Text size="xs" c="dimmed" mt="xs">
              m² rodados: o que a máquina imprimiu. m² cobrados: com o mínimo de 1 m² por unidade (RN16).
            </Text>
          </Quadro>

          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Quadro titulo="Pedidos concluídos por máquina">
              {dados.pedidosPorMaquina.length === 0 ? (
                <Text c="dimmed" size="sm">
                  Nenhum pedido concluído neste período.
                </Text>
              ) : (
                <BarChart
                  h={200}
                  data={dados.pedidosPorMaquina}
                  dataKey="maquina"
                  series={[{ name: "quantidade", label: "Pedidos", color: "coopersign.4" }]}
                  tickLine="y"
                  gridAxis="y"
                />
              )}
            </Quadro>
            <Quadro titulo="Materiais mais usados">
              {dados.pedidosPorMaterial.length === 0 ? (
                <Text c="dimmed" size="sm">
                  Nenhum pedido concluído neste período.
                </Text>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Material</Table.Th>
                      <Table.Th ta="right">Pedidos</Table.Th>
                      <Table.Th ta="right">m² rodados</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {dados.pedidosPorMaterial.map((linha) => (
                      <Table.Tr key={linha.material}>
                        <Table.Td>{linha.material}</Table.Td>
                        <Table.Td ta="right">{linha.quantidade}</Table.Td>
                        <Table.Td ta="right">{formatarArea(linha.metragem)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Quadro>
          </SimpleGrid>

          <Quadro titulo="Retrabalhos do período">
            {dados.retrabalhos.length === 0 ? (
              <Text c="dimmed" size="sm">
                Nenhum retrabalho neste período.
              </Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Data</Table.Th>
                    <Table.Th>Cliente</Table.Th>
                    <Table.Th>Material</Table.Th>
                    <Table.Th>Motivo</Table.Th>
                    <Table.Th ta="right">Custo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {dados.retrabalhos.map((r) => (
                    <Table.Tr key={r.id}>
                      <Table.Td>{formatarMomento(r.data)}</Table.Td>
                      <Table.Td>
                        <Anchor component={Link} to={`/pedidos/${r.pedidoId}`} size="sm">
                          {r.cliente}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>{r.material}</Table.Td>
                      <Table.Td>{r.motivo}</Table.Td>
                      <Table.Td ta="right">{formatarMoeda(r.custo)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
                <Table.Tfoot>
                  <Table.Tr>
                    <Table.Th colSpan={4}>Total gasto com retrabalho</Table.Th>
                    <Table.Th ta="right">{formatarMoeda(dados.custoRetrabalho)}</Table.Th>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>
            )}
          </Quadro>

          <Quadro titulo="Pedidos concluídos no período" className="quebra-antes">
            {dados.pedidos.length === 0 ? (
              <Text c="dimmed" size="sm">
                Nenhum pedido concluído neste período.
              </Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Concluído em</Table.Th>
                    <Table.Th>Cliente</Table.Th>
                    <Table.Th>Material</Table.Th>
                    <Table.Th ta="right">m²</Table.Th>
                    <Table.Th>Pagamento</Table.Th>
                    <Table.Th ta="right">Valor</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {dados.pedidos.map((pedido) => (
                    <Table.Tr key={pedido.id}>
                      <Table.Td>{pedido.concluidoEm ? formatarMomento(pedido.concluidoEm) : "—"}</Table.Td>
                      <Table.Td>
                        <Anchor component={Link} to={`/pedidos/${pedido.id}`} size="sm">
                          {pedido.cliente.nome}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>{pedido.material.tipo}</Table.Td>
                      <Table.Td ta="right">{formatarArea(pedido.metragemTotal)}</Table.Td>
                      <Table.Td>{FORMA_PAGAMENTO[pedido.formaPagamento]}</Table.Td>
                      <Table.Td ta="right">{formatarMoeda(pedido.valorTotal)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Quadro>
        </Stack>
      )}
    </>
  );
}
