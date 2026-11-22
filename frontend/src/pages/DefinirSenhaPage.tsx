import { type FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Anchor, Button, Center, Loader, Paper, PasswordInput, Stack, Text, Title } from "@mantine/core";
import { api } from "../api";
import { Logo } from "../components/Logo";

type DadosLink = { nome: string; email: string; tipo: "CONVITE" | "RECUPERACAO" };

export function DefinirSenhaPage() {
  const [parametros] = useSearchParams();
  const token = parametros.get("token") ?? "";
  const [dados, setDados] = useState<DadosLink | null>(null);
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api<DadosLink>(`/auth/link-senha?${new URLSearchParams({ token })}`)
      .then(setDados)
      .catch((e) => setErro(e.message));
  }, [token]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    if (senha !== confirmacao) {
      setErro("As duas senhas não são iguais.");
      return;
    }
    setEnviando(true);
    try {
      await api("/auth/definir-senha", { metodo: "POST", corpo: { token, senha } });
      setPronto(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao definir a senha");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Center mih="100vh" bg="coopersign.6">
      <Paper withBorder p="xl" radius="md" w="100%" maw={380}>
        <Stack>
          <Center>
            <Logo tamanho={72} />
          </Center>
          <Title order={3}>{dados?.tipo === "CONVITE" ? "Criar sua senha" : "Nova senha"}</Title>

          {!dados && !erro && <Loader />}
          {erro && <Alert color="red">{erro}</Alert>}

          {pronto && (
            <>
              <Alert color="green">Senha definida. Já pode entrar com {dados?.email}.</Alert>
              <Button component={Link} to="/login">
                Ir para o login
              </Button>
            </>
          )}

          {dados && !pronto && (
            <form onSubmit={enviar}>
              <Stack>
                <Text size="sm">
                  Olá, {dados.nome}. Seu acesso é pelo e-mail <b>{dados.email}</b>.
                </Text>
                <PasswordInput
                  label="Senha"
                  description="Pelo menos 6 caracteres"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.currentTarget.value)}
                />
                <PasswordInput
                  label="Repita a senha"
                  required
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.currentTarget.value)}
                />
                <Button type="submit" loading={enviando}>
                  Salvar senha
                </Button>
              </Stack>
            </form>
          )}

          {!pronto && (
            <Anchor component={Link} to="/login" size="sm">
              Voltar para o login
            </Anchor>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}
