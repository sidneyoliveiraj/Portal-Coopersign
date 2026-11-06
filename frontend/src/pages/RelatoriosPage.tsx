import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Anchor, Button, Group, Loader, Paper, SimpleGrid, Table, Text, TextInput, Title } from "@mantine/core";
import { api } from "../api";
import type { Pedido } from "../tipos";
import { FORMA_PAGAMENTO, formatarArea, formatarMoeda, formatarMomento, hojeIso, inicioDoMes } from "../formato";

type ResumoRetrabalho = { quantidade: number; custoInformado: number; semCusto: number };

type Indicadores = {
  receitaTotal: number;
  receitaPorForma: { A_VISTA: number; EM_CONTA: number };
  pedidosConcluidos: number;
  pedidosPorMaquina: { maquina: string; quantidade: number }[];
  pedidosPorMaterial: { material: string; quantidade: number; metragem: number }[];
  taxaRetrabalho: number | null;
  tempoMedioHoras: number | null;
  retrabalhoProducao: ResumoRetrabalho;
  retrabalhoGarantia: ResumoRetrabalho;
  pedidos: Pedido[];
};

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <Paper withBorder p="md">
      <Text size="xs" c="dimmed">
        {rotulo}
      </Text>
      <Text size="xl" fw={600}>
        {valor}
      </Text>
      {detalhe && (
        <Text size="xs" c="dimmed">
          {detalhe}
        </Text>
      )}
    </Paper>
  );
}

function descreverSemCusto({ semCusto }: ResumoRetrabalho) {
  return semCusto > 0 ? `${semCusto} sem custo informado` : undefined;
}

export function RelatoriosPage() {
  const [inicio, setInicio] = useState(inicioDoMes());
  const [fim, setFim] = useState(hojeIso());
  const [dados, setDados] = useState<Indicadores | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (de: string, ate: string) => {
    setErro(null);
    try {
      setDados(await api<Indicadores>(`/faturamento/indicadores?${new URLSearchParams({ inicio: de, fim: ate })}`));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao carregar os indicadores");
    }
  }, []);

  useEffect(() => {
    carregar(inicioDoMes(), hojeIso());
  }, [carregar]);

  function filtrar(evento: FormEvent) {
    evento.preventDefault();
    carregar(inicio, fim);
  }

  return (
    <>
      <Group justify="space-between" align="flex-end" mb="md">
        <Title order={3}>Relatórios</Title>
        <form onSubmit={filtrar}>
          <Group align="flex-end">
            <TextInput label="De" type="date" required value={inicio} onChange={(e) => setInicio(e.currentTarget.value)} />
            <TextInput label="Até" type="date" required value={fim} onChange={(e) => setFim(e.currentTarget.value)} />
            <Button type="submit" variant="default">
              Filtrar
            </Button>
          </Group>
        </form>
      </Group>

      {erro && (
        <Alert color="red" mb="md">
          {erro}
        </Alert>
      )}
      {!dados && !erro && <Loader />}

      {dados && (
        <>
          <SimpleGrid cols={{ base: 2, md: 4 }} mb="md">
            <Indicador rotulo="Receita total" valor={formatarMoeda(dados.receitaTotal)} />
            <Indicador rotulo="À vista" valor={formatarMoeda(dados.receitaPorForma.A_VISTA)} />
            <Indicador rotulo="Em conta" valor={formatarMoeda(dados.receitaPorForma.EM_CONTA)} />
            <Indicador rotulo="Pedidos concluídos" valor={String(dados.pedidosConcluidos)} />
            <Indicador
              rotulo="Taxa de retrabalho"
              valor={dados.taxaRetrabalho === null ? "—" : `${dados.taxaRetrabalho.toLocaleString("pt-BR")}%`}
              detalhe="Retrabalhos por pedido concluído"
            />
            <Indicador
              rotulo="Tempo médio de produção"
              valor={dados.tempoMedioHoras === null ? "—" : `${dados.tempoMedioHoras.toLocaleString("pt-BR")} h`}
            />
            <Indicador
              rotulo="Custo de retrabalho de produção"
              valor={formatarMoeda(dados.retrabalhoProducao.custoInformado)}
              detalhe={descreverSemCusto(dados.retrabalhoProducao)}
            />
            <Indicador
              rotulo="Custo de retrabalho de garantia"
              valor={formatarMoeda(dados.retrabalhoGarantia.custoInformado)}
              detalhe={descreverSemCusto(dados.retrabalhoGarantia)}
            />
          </SimpleGrid>

          {dados.pedidosPorMaquina.length > 0 && (
            <>
              <Title order={5} mb="xs">
                Pedidos concluídos por máquina
              </Title>
              <Table withTableBorder mb="md">
                <Table.Tbody>
                  {dados.pedidosPorMaquina.map((linha) => (
                    <Table.Tr key={linha.maquina}>
                      <Table.Td>{linha.maquina}</Table.Td>
                      <Table.Td ta="right">{linha.quantidade}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </>
          )}

          {dados.pedidosPorMaterial.length > 0 && (
            <>
              <Title order={5} mb="xs">
                Materiais mais usados
              </Title>
              <Table withTableBorder mb="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Material</Table.Th>
                    <Table.Th ta="right">Pedidos</Table.Th>
                    <Table.Th ta="right">Metragem vendida</Table.Th>
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
            </>
          )}

          <Title order={5} mb="xs">
            Pedidos concluídos no período
          </Title>
          {dados.pedidos.length === 0 && <Text c="dimmed">Nenhum pedido concluído neste período.</Text>}
          {dados.pedidos.length > 0 && (
            <Table withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Concluído em</Table.Th>
                  <Table.Th>Cliente</Table.Th>
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
                    <Table.Td>{FORMA_PAGAMENTO[pedido.formaPagamento]}</Table.Td>
                    <Table.Td ta="right">{formatarMoeda(pedido.valorTotal)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </>
      )}
    </>
  );
}
