import { Button, CopyButton, Group, Modal, Stack, Text, TextInput } from "@mantine/core";

export function montarLinkAcesso(token: string) {
  return `${window.location.origin}/definir-senha?token=${token}`;
}

// Mostra o link de uso unico para o gestor copiar e mandar ao usuario (WhatsApp, e-mail).
export function LinkAcessoModal({
  titulo,
  explicacao,
  token,
  aoFechar,
}: {
  titulo: string;
  explicacao: string;
  token: string;
  aoFechar: () => void;
}) {
  const link = montarLinkAcesso(token);
  return (
    <Modal opened onClose={aoFechar} title={titulo}>
      <Stack gap="sm">
        <Text size="sm">{explicacao}</Text>
        <TextInput readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        <Text size="xs" c="dimmed">
          O link só funciona uma vez. Depois de fechar esta janela ele não aparece de novo; se perder, gere outro.
        </Text>
        <Group justify="flex-end">
          <CopyButton value={link}>
            {({ copied, copy }) => (
              <Button color={copied ? "green" : undefined} onClick={copy}>
                {copied ? "Copiado" : "Copiar link"}
              </Button>
            )}
          </CopyButton>
          <Button variant="default" onClick={aoFechar}>
            Fechar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
