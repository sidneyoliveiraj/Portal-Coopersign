import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { api } from "../api";
import type { Cliente } from "../tipos";

type Conta = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  cliente: { nome: string } | null;
};

export function ContasClientesPage() {
  const [contas, setContas] = useState<Conta[] | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    return api<{ usuarios: Conta[] }>("/usuarios/clientes")
      .then(({ usuarios }) => setContas(usuarios))
      .catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    carregar();
    api<{ clientes: Cliente[] }>("/clientes")
      .then(({ clientes }) => setClientes(clientes))
      .catch((e) => setErro(e.message));
  }, [carregar]);

  async function acao(caminho: string, metodo: string, corpo?: unknown) {
    setErro(null);
    try {
      await api(caminho, { metodo, corpo });
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao atualizar a conta");
    }
  }

  function abrir() {
    setClienteId(null);
    setEmail("");
    setSenha("");
    setErroForm(null);
    setAberto(true);
  }

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    setErroForm(null);
    setSalvando(true);
    try {
      await api("/usuarios/clientes", { metodo: "POST", corpo: { clienteId, email, senha } });
      setAberto(false);
      await carregar();
    } catch (e) {
      setErroForm(e instanceof Error ? e.message : "erro ao criar a conta");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={3}>Contas de clientes</Title>
        <Button onClick={abrir}>Criar acesso</Button>
      </Group>

      {erro && (
        <Alert color="red" mb="md">
          {erro}
        </Alert>
      )}
      {!contas && !erro && <Loader />}
      {contas?.length === 0 && <Text c="dimmed">Nenhuma conta de cliente ainda.</Text>}

      {contas && contas.length > 0 && (
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>E-mail</Table.Th>
              <Table.Th>Situação</Table.Th>
              <Table.Th w={130}>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {contas.map((conta) => (
              <Table.Tr key={conta.id}>
                <Table.Td>{conta.cliente?.nome ?? conta.nome}</Table.Td>
                <Table.Td>{conta.email}</Table.Td>
                <Table.Td>
                  <Badge color={conta.ativo ? "green" : "yellow"} variant="light">
                    {conta.ativo ? "Ativa" : "Inativa ou aguardando aprovação"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {conta.ativo ? (
                    <Button
                      size="xs"
                      variant="default"
                      onClick={() => acao(`/usuarios/${conta.id}`, "PUT", { ativo: false })}
                    >
                      Desativar
                    </Button>
                  ) : (
                    <Button size="xs" onClick={() => acao(`/usuarios/${conta.id}/aprovar`, "POST")}>
                      Aprovar
                    </Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={aberto} onClose={() => setAberto(false)} title="Criar acesso para cliente">
        <form onSubmit={criar}>
          <Stack gap="sm">
            {erroForm && <Alert color="red">{erroForm}</Alert>}
            <Select
              label="Cliente"
              placeholder="Selecione"
              searchable
              required
              data={clientes.map((c) => ({ value: c.id, label: c.nome }))}
              value={clienteId}
              onChange={setClienteId}
            />
            <TextInput
              label="E-mail de acesso"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <PasswordInput
              label="Senha inicial"
              description="Pelo menos 6 caracteres"
              required
              value={senha}
              onChange={(e) => setSenha(e.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button type="submit" loading={salvando} disabled={!clienteId}>
                Criar acesso
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
