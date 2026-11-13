import { type FormEvent, useState } from "react";
import { Alert, Button, Group, Modal, NumberInput, Stack, Text, TextInput } from "@mantine/core";
import { api } from "../api";
import type { Pedido } from "../tipos";
import { formatarMoeda } from "../formato";

// Retrabalho = erro da Coopersign: o cliente não paga de novo e o custo vira despesa.
export function FormRetrabalho({
  pedido,
  aoFechar,
  aoSalvar,
}: {
  pedido: Pedido;
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
      await api(`/fila/pedidos/${pedido.id}/retrabalho`, {
        metodo: "POST",
        corpo: { motivo, custoOperacional },
      });
      aoSalvar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao registrar retrabalho");
      setSalvando(false);
    }
  }

  return (
    <Modal opened onClose={aoFechar} title="Registrar retrabalho">
      <form onSubmit={enviar}>
        <Stack gap="sm">
          <Text size="sm">
            {pedido.cliente.nome} · {pedido.material.tipo}
          </Text>
          <Text size="xs" c="dimmed">
            O cliente não paga de novo. O custo entra como despesa nos Relatórios e o pedido volta para a fila da
            máquina.
          </Text>
          {erro && <Alert color="red">{erro}</Alert>}
          <TextInput label="Motivo" required value={motivo} onChange={(e) => setMotivo(e.currentTarget.value)} />
          <NumberInput
            label="Custo do retrabalho (R$)"
            description="Quanto a Coopersign gastou para refazer (material, tinta)."
            required
            min={0.01}
            decimalScale={2}
            decimalSeparator=","
            value={custoOperacional}
            onChange={setCustoOperacional}
          />
          <Group justify="space-between">
            <Button type="button" variant="default" onClick={() => setCustoOperacional(Number(pedido.valorBase))}>
              Valor cheio ({formatarMoeda(pedido.valorBase)})
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
