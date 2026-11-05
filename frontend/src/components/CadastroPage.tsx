import { type FormEvent, Fragment, type ReactNode, useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  PasswordInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { api } from "../api";

export type Item = { id: string } & Record<string, unknown>;

export type CampoCadastro = {
  nome: string;
  rotulo: string;
  tipo?: "texto" | "email" | "senha" | "dinheiro" | "selecao" | "booleano";
  obrigatorio?: boolean;
  opcoes?: { value: string; label: string }[];
  padrao?: string;
  somenteAo?: "criar" | "editar";
};

export type ColunaCadastro = {
  rotulo: string;
  valor: (item: Item) => ReactNode;
  direita?: boolean;
};

type Props = {
  titulo: string;
  singular: string;
  caminho: string;
  chaveLista: string;
  campos: CampoCadastro[];
  colunas: ColunaCadastro[];
  podeRemover?: boolean;
};

type Valores = Record<string, string | number>;

const SIM_NAO = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];

function valorDoCampo(campo: CampoCadastro, valor: string | number) {
  if (campo.tipo === "booleano") {
    return valor === "true";
  }
  return valor === "" && !campo.obrigatorio ? null : valor;
}

export function CadastroPage({ titulo, singular, caminho, chaveLista, campos, colunas, podeRemover = true }: Props) {
  const [itens, setItens] = useState<Item[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Item | null>(null);
  const [valores, setValores] = useState<Valores>({});
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    return api<Record<string, Item[]>>(caminho)
      .then((dados) => setItens(dados[chaveLista]))
      .catch((e) => setErro(e.message));
  }, [caminho, chaveLista]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const camposVisiveis = campos.filter((c) => !c.somenteAo || c.somenteAo === (editando ? "editar" : "criar"));

  function abrir(item: Item | null) {
    const iniciais: Valores = {};
    for (const campo of campos) {
      const atual = item?.[campo.nome];
      iniciais[campo.nome] = atual === undefined || atual === null ? (campo.padrao ?? "") : String(atual);
    }
    setValores(iniciais);
    setEditando(item);
    setErroForm(null);
    setAberto(true);
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErroForm(null);
    setSalvando(true);
    try {
      const corpo = Object.fromEntries(camposVisiveis.map((c) => [c.nome, valorDoCampo(c, valores[c.nome])]));
      await api(editando ? `${caminho}/${editando.id}` : caminho, {
        metodo: editando ? "PUT" : "POST",
        corpo,
      });
      setAberto(false);
      await carregar();
    } catch (e) {
      setErroForm(e instanceof Error ? e.message : "erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(item: Item) {
    if (!window.confirm(`Remover este registro de ${singular.toLowerCase()}?`)) {
      return;
    }
    setErro(null);
    try {
      await api(`${caminho}/${item.id}`, { metodo: "DELETE" });
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao remover");
    }
  }

  function alterar(nome: string, valor: string | number) {
    setValores((atuais) => ({ ...atuais, [nome]: valor }));
  }

  function renderizarCampo(campo: CampoCadastro) {
    const comum = { label: campo.rotulo, required: campo.obrigatorio };
    const valor = valores[campo.nome] ?? "";

    switch (campo.tipo) {
      case "dinheiro":
        return (
          <NumberInput
            {...comum}
            min={0}
            decimalScale={2}
            decimalSeparator=","
            value={valor}
            onChange={(v) => alterar(campo.nome, v)}
          />
        );
      case "selecao":
      case "booleano":
        return (
          <Select
            {...comum}
            allowDeselect={false}
            data={campo.tipo === "booleano" ? SIM_NAO : campo.opcoes}
            value={String(valor)}
            onChange={(v) => alterar(campo.nome, v ?? "")}
          />
        );
      case "senha":
        return (
          <PasswordInput {...comum} value={String(valor)} onChange={(e) => alterar(campo.nome, e.currentTarget.value)} />
        );
      default:
        return (
          <TextInput
            {...comum}
            type={campo.tipo === "email" ? "email" : "text"}
            value={String(valor)}
            onChange={(e) => alterar(campo.nome, e.currentTarget.value)}
          />
        );
    }
  }

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={3}>{titulo}</Title>
        <Button onClick={() => abrir(null)}>Novo cadastro</Button>
      </Group>

      {erro && (
        <Alert color="red" mb="md">
          {erro}
        </Alert>
      )}
      {!itens && !erro && <Loader />}
      {itens?.length === 0 && <Text c="dimmed">Nenhum registro ainda.</Text>}

      {itens && itens.length > 0 && (
        <Table withTableBorder highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {colunas.map((coluna) => (
                <Table.Th key={coluna.rotulo} ta={coluna.direita ? "right" : undefined}>
                  {coluna.rotulo}
                </Table.Th>
              ))}
              <Table.Th w={170}>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {itens.map((item) => (
              <Table.Tr key={item.id}>
                {colunas.map((coluna) => (
                  <Table.Td key={coluna.rotulo} ta={coluna.direita ? "right" : undefined}>
                    {coluna.valor(item)}
                  </Table.Td>
                ))}
                <Table.Td>
                  <Group gap="xs">
                    <Button size="xs" variant="default" onClick={() => abrir(item)}>
                      Editar
                    </Button>
                    {podeRemover && (
                      <Button size="xs" variant="subtle" color="red" onClick={() => remover(item)}>
                        Remover
                      </Button>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={aberto} onClose={() => setAberto(false)} title={`${editando ? "Editar" : "Novo"}: ${singular}`}>
        <form onSubmit={salvar}>
          <Stack gap="sm">
            {erroForm && <Alert color="red">{erroForm}</Alert>}
            {camposVisiveis.map((campo) => (
              <Fragment key={campo.nome}>{renderizarCampo(campo)}</Fragment>
            ))}
            <Group justify="flex-end">
              <Button type="submit" loading={salvando}>
                Salvar
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
