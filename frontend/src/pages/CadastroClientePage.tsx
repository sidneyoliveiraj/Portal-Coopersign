import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Anchor, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { api } from "../api";

export function CadastroClientePage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await api("/auth/cadastro", { metodo: "POST", corpo: { nome, email, senha } });
      setConcluido(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao enviar o cadastro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Center h="100vh" bg="gray.0">
      <Paper withBorder p="xl" radius="md" w={380}>
        {concluido ? (
          <Stack>
            <Title order={3}>Cadastro recebido</Title>
            <Text size="sm">Você poderá entrar assim que o gestor aprovar o seu cadastro.</Text>
            <Anchor component={Link} to="/login" size="sm">
              Voltar para o login
            </Anchor>
          </Stack>
        ) : (
          <form onSubmit={enviar}>
            <Stack>
              <div>
                <Title order={3}>Criar conta de cliente</Title>
                <Text size="sm" c="dimmed">
                  Para acompanhar os seus pedidos
                </Text>
              </div>
              {erro && <Alert color="red">{erro}</Alert>}
              <TextInput label="Nome ou empresa" required value={nome} onChange={(e) => setNome(e.currentTarget.value)} />
              <TextInput
                label="E-mail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
              <PasswordInput
                label="Senha"
                description="Pelo menos 6 caracteres"
                required
                value={senha}
                onChange={(e) => setSenha(e.currentTarget.value)}
              />
              <Button type="submit" loading={enviando}>
                Enviar cadastro
              </Button>
              <Anchor component={Link} to="/login" size="sm">
                Já tenho conta
              </Anchor>
            </Stack>
          </form>
        )}
      </Paper>
    </Center>
  );
}
