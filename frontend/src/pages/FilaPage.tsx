import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { api } from "../api";
import { useAtualizacoesDePedidos } from "../tempoReal";
import { useAuth } from "../auth";
import type { Maquina, Pedido } from "../tipos";
import { formatarArea, formatarData, formatarMedidas, formatarMoeda, STATUS_PEDIDO } from "../formato";

type RetrabalhoAberto = { pedido: Pedido; garantia: boolean };

function FormRetrabalho({
  alvo,
  aoFechar,
  aoSalvar,
}: {
  alvo: RetrabalhoAberto;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [custoOperacional, setCustoOperacional] = useState<number | string>("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await api(`/fila/pedidos/${alvo.pedido.id}/retrabalho`, {
        metodo: "POST",
        corpo: { motivo, custoOperacional, garantia: alvo.garantia },
      });
      aoSalvar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao registrar retrabalho");
      setSalvando(false);
    }
  }

  return (
    <Modal
      opened
      onClose={aoFechar}
      title={alvo.garantia ? "Retrabalho de garantia (sem custo ao cliente)" : "Retrabalho de produção"}
    >
      <form onSubmit={enviar}>
        <Stack gap="sm">
          <Text size="sm">{alvo.pedido.cliente.nome}</Text>
          {erro && <Alert color="red">{erro}</Alert>}
          <TextInput label="Motivo" required value={motivo} onChange={(e) => setMotivo(e.currentTarget.value)} />
          <NumberInput
            label="Custo operacional (R$)"
            description={alvo.garantia ? undefined : "Deixe em branco se não souber o custo."}
            required={alvo.garantia}
            min={0}
            decimalScale={2}
            decimalSeparator=","
            value={custoOperacional}
            onChange={setCustoOperacional}
          />
          <Group justify="space-between">
            <Button
              type="button"
              variant="default"
              onClick={() => setCustoOperacional(Number(alvo.pedido.valorBase))}
            >
              Valor cheio ({formatarMoeda(alvo.pedido.valorBase)})
            </Button>
            <Button type="submit" loading={salvando}>
              Registrar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

function CampoPosicao({
  posicao,
  total,
  aoMover,
}: {
  posicao: number;
  total: number;
  aoMover: (posicao: number) => void;
}) {
  const [valor, setValor] = useState(String(posicao));

  useEffect(() => {
    setValor(String(posicao));
  }, [posicao]);

  function confirmar() {
    const destino = Math.min(Number(valor), total);
    if (destino >= 1 && destino !== posicao) {
      aoMover(destino);
    }
  }

  return (
    <TextInput
      size="xs"
      w={52}
      inputMode="numeric"
      aria-label="Posição na fila"
      value={valor}
      onChange={(e) => setValor(e.currentTarget.value.replace(/\D/g, ""))}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => setValor(String(posicao))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          confirmar();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export function FilaPage() {
  const { usuario } = useAuth();
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [maquinaId, setMaquinaId] = useState<string | null>(null);
  const [fila, setFila] = useState<Pedido[] | null>(null);
  const [concluidos, setConcluidos] = useState<Pedido[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [retrabalho, setRetrabalho] = useState<RetrabalhoAberto | null>(null);

  const podeMover = usuario?.perfil === "ADMINISTRADOR" || usuario?.perfil === "GESTOR";

  const carregarFila = useCallback(async () => {
    if (!maquinaId) {
      return;
    }
    try {
      const dados = await api<{ fila: Pedido[]; concluidos: Pedido[] }>(`/fila/maquinas/${maquinaId}`);
      setFila(dados.fila);
      setConcluidos(dados.concluidos);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao carregar a fila");
    }
  }, [maquinaId]);

  useAtualizacoesDePedidos(carregarFila);

  useEffect(() => {
    api<{ maquinas: Maquina[] }>("/maquinas")
      .then(({ maquinas }) => {
        setMaquinas(maquinas);
        setMaquinaId((maquinas.find((m) => m.status === "ATIVA") ?? maquinas[0])?.id ?? null);
      })
      .catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    carregarFila();
  }, [carregarFila]);

  async function executar(caminho: string, corpo: unknown) {
    setErro(null);
    try {
      await api(caminho, { metodo: "POST", corpo });
      await carregarFila();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao atualizar o pedido");
    }
  }

  function atualizarStatus(pedido: Pedido, status: string) {
    return executar(`/fila/pedidos/${pedido.id}/status`, { status });
  }

  return (
    <>
      <Group justify="space-between" align="flex-end" mb="md">
        <Title order={3}>Fila de produção</Title>
        <Select
          label="Máquina"
          w={280}
          allowDeselect={false}
          data={maquinas.map((m) => ({
            value: m.id,
            label: m.status === "ATIVA" ? m.nome : `${m.nome} (indisponível)`,
          }))}
          value={maquinaId}
          onChange={setMaquinaId}
        />
      </Group>

      {erro && (
        <Alert color="red" mb="md">
          {erro}
        </Alert>
      )}
      {maquinaId && !fila && !erro && <Loader />}
      {fila?.length === 0 && <Text c="dimmed">Nenhum pedido na fila desta máquina.</Text>}

      {fila && fila.length > 0 && (
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>Material</Table.Th>
              <Table.Th>Medidas</Table.Th>
              <Table.Th ta="right">Metragem</Table.Th>
              <Table.Th>Prazo</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {fila.map((pedido, indice) => {
              const status = STATUS_PEDIDO[pedido.status];
              return (
                <Table.Tr key={pedido.id}>
                  <Table.Td>
                    {podeMover ? (
                      <CampoPosicao
                        posicao={indice + 1}
                        total={fila.length}
                        aoMover={(posicao) => executar(`/fila/pedidos/${pedido.id}/mover`, { posicao })}
                      />
                    ) : (
                      indice + 1
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Anchor component={Link} to={`/pedidos/${pedido.id}`} size="sm">
                      {pedido.cliente.nome}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{pedido.material.tipo}</Table.Td>
                  <Table.Td>{formatarMedidas(pedido)}</Table.Td>
                  <Table.Td ta="right">{formatarArea(pedido.metragemTotal)}</Table.Td>
                  <Table.Td>{formatarData(pedido.prazoEntrega)}</Table.Td>
                  <Table.Td>
                    <Badge color={status.cor} variant="light">
                      {status.rotulo}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {pedido.status !== "EM_PRODUCAO" && (
                        <Button size="xs" onClick={() => atualizarStatus(pedido, "EM_PRODUCAO")}>
                          Iniciar
                        </Button>
                      )}
                      {pedido.status === "EM_PRODUCAO" && (
                        <>
                          <Button size="xs" color="green" onClick={() => atualizarStatus(pedido, "CONCLUIDO")}>
                            Concluir
                          </Button>
                          <Button
                            size="xs"
                            variant="default"
                            onClick={() => setRetrabalho({ pedido, garantia: false })}
                          >
                            Retrabalho
                          </Button>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      {concluidos.length > 0 && (
        <>
          <Title order={5} mt="xl" mb="xs">
            Concluídos recentemente
          </Title>
          <Table withTableBorder>
            <Table.Tbody>
              {concluidos.map((pedido) => (
                <Table.Tr key={pedido.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/pedidos/${pedido.id}`} size="sm">
                      {pedido.cliente.nome}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{pedido.material.tipo}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <Button size="xs" variant="default" onClick={() => setRetrabalho({ pedido, garantia: false })}>
                        Retrabalho
                      </Button>
                      <Button size="xs" variant="default" onClick={() => setRetrabalho({ pedido, garantia: true })}>
                        Garantia
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      )}

      {retrabalho && (
        <FormRetrabalho
          alvo={retrabalho}
          aoFechar={() => setRetrabalho(null)}
          aoSalvar={() => {
            setRetrabalho(null);
            carregarFila();
          }}
        />
      )}
    </>
  );
}
