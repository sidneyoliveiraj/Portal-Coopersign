import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Anchor, Button, Center, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { api } from "../api";
import { Logo } from "../components/Logo";

export function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await api("/auth/esqueci-senha", { metodo: "POST", corpo: { email } });
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao pedir nova senha");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Center mih="100vh" bg="coopersign.6">
      <Paper withBorder p="xl" radius="md" w="100%" maw={380}>
        <form onSubmit={enviar}>
          <Stack>
            <Center>
              <Logo tamanho={72} />
            </Center>
            <Title order={3}>Esqueci minha senha</Title>
            {enviado ? (
              <Alert color="green">
                Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha. Se não chegar,
                peça um novo link à Coopersign.
              </Alert>
            ) : (
              <>
                <Text size="sm" c="dimmed">
                  Informe o e-mail de acesso.
                </Text>
                {erro && <Alert color="red">{erro}</Alert>}
                <TextInput
                  label="E-mail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                />
                <Button type="submit" loading={enviando}>
                  Enviar link
                </Button>
              </>
            )}
            <Anchor component={Link} to="/login" size="sm">
              Voltar para o login
            </Anchor>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
