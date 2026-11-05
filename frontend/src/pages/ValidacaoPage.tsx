import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Anchor, Button, Group, Loader, Paper, Select, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";
import { api } from "../api";
import type { Maquina, Pedido } from "../tipos";
import { formatarArea, formatarData } from "../formato";

function CartaoValidacao({
  pedido,
  maquinas,
  aoConcluir,
}: {
  pedido: Pedido;
  maquinas: Maquina[];
  aoConcluir: () => void;
}) {
  const [maquinaId, setMaquinaId] = useState<string | null>(null);
  const [observacaoTecnica, setObservacaoTecnica] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function enviar(acao: "aprovar" | "rejeitar", corpo: Record<string, unknown>) {
    setErro(null);
    setSalvando(true);
    try {
      await api(`/pedidos/${pedido.id}/${acao}`, { metodo: "POST", corpo: { ...corpo, observacaoTecnica } });
      aoConcluir();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao salvar");
      setSalvando(false);
    }
  }

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" mb="xs">
        <Anchor component={Link} to={`/pedidos/${pedido.id}`} fw={600}>
          {pedido.cliente.nome}
        </Anchor>
        <Text size="sm" c="dimmed">
          Prazo: {formatarData(pedido.prazoEntrega)}
        </Text>
      </Group>
      <Text size="sm" mb="sm">
        {pedido.material.tipo} · {formatarArea(pedido.metragemTotal)} · {pedido.acabamento} ·{" "}
        <Anchor href={pedido.arquivoUrl} target="_blank" rel="noreferrer" size="sm">
          Abrir arquivo
        </Anchor>
      </Text>

      <Stack gap="sm">
        {erro && <Alert color="red">{erro}</Alert>}
        <Textarea
          label="Observações técnicas"
          autosize
          minRows={1}
          value={observacaoTecnica}
          onChange={(e) => setObservacaoTecnica(e.currentTarget.value)}
        />
        <Group align="flex-end" grow>
          <Select
            label="Máquina"
            placeholder="Selecione"
            data={maquinas.map((m) => ({ value: m.id, label: `${m.nome} (${m.tipo})` }))}
            value={maquinaId}
            onChange={setMaquinaId}
          />
          <Button disabled={!maquinaId} loading={salvando} onClick={() => enviar("aprovar", { maquinaId })}>
            Aprovar e enviar para a fila
          </Button>
        </Group>
        <Group align="flex-end" grow>
          <TextInput
            label="Justificativa da rejeição"
            value={justificativa}
            onChange={(e) => setJustificativa(e.currentTarget.value)}
          />
          <Button
            color="red"
            variant="light"
            disabled={justificativa.trim().length === 0}
            loading={salvando}
            onClick={() => enviar("rejeitar", { justificativa })}
          >
            Rejeitar
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

export function ValidacaoPage() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  function carregarPedidos() {
    api<{ pedidos: Pedido[] }>("/pedidos/validacao")
      .then(({ pedidos }) => setPedidos(pedidos))
      .catch((e) => setErro(e.message));
  }

  useEffect(() => {
    carregarPedidos();
    api<{ maquinas: Maquina[] }>("/maquinas")
      .then(({ maquinas }) => setMaquinas(maquinas.filter((m) => m.status === "ATIVA")))
      .catch((e) => setErro(e.message));
  }, []);

  return (
    <>
      <Title order={3} mb="md">
        Validação técnica
      </Title>

      {erro && <Alert color="red">{erro}</Alert>}
      {!pedidos && !erro && <Loader />}
      {pedidos?.length === 0 && <Text c="dimmed">Nenhum pedido aguardando validação.</Text>}

      <Stack>
        {pedidos?.map((pedido) => (
          <CartaoValidacao key={pedido.id} pedido={pedido} maquinas={maquinas} aoConcluir={carregarPedidos} />
        ))}
      </Stack>
    </>
  );
}
