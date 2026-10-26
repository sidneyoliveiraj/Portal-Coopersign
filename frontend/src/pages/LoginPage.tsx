import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { useAuth } from "../auth";

export function LoginPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email, senha);
      navigate("/pedidos");
    } catch {
      setErro("E-mail ou senha incorretos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Center h="100vh" bg="gray.0">
      <Paper withBorder p="xl" radius="md" w={380}>
        <form onSubmit={enviar}>
          <Stack>
            <div>
              <Title order={3}>Portal Coopersign</Title>
              <Text size="sm" c="dimmed">
                Entre com seu e-mail e senha
              </Text>
            </div>
            {erro && <Alert color="red">{erro}</Alert>}
            <TextInput
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <PasswordInput
              label="Senha"
              required
              value={senha}
              onChange={(e) => setSenha(e.currentTarget.value)}
            />
            <Button type="submit" loading={enviando}>
              Entrar
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
