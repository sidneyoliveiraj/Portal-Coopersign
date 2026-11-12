import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react";
import { Button, Group, Modal, Text } from "@mantine/core";

type OpcoesConfirmacao = {
  titulo: string;
  mensagem: ReactNode;
  rotuloConfirmar?: string;
  cor?: string;
};

type Confirmar = (opcoes: OpcoesConfirmacao) => Promise<boolean>;

const ConfirmacaoContext = createContext<Confirmar | null>(null);

/**
 * Janela de confirmação do próprio sistema, no lugar do window.confirm do
 * navegador. Uso: `if (!(await confirmar({ titulo, mensagem }))) return;`
 */
export function ConfirmacaoProvider({ children }: { children: ReactNode }) {
  const [opcoes, setOpcoes] = useState<OpcoesConfirmacao | null>(null);
  const resolver = useRef<(resposta: boolean) => void>(() => {});

  const confirmar = useCallback<Confirmar>((novas) => {
    setOpcoes(novas);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function responder(resposta: boolean) {
    resolver.current(resposta);
    setOpcoes(null);
  }

  return (
    <ConfirmacaoContext.Provider value={confirmar}>
      {children}
      <Modal opened={opcoes !== null} onClose={() => responder(false)} title={opcoes?.titulo} centered>
        <Text size="sm">{opcoes?.mensagem}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => responder(false)}>
            Cancelar
          </Button>
          <Button color={opcoes?.cor} onClick={() => responder(true)} data-autofocus>
            {opcoes?.rotuloConfirmar ?? "Confirmar"}
          </Button>
        </Group>
      </Modal>
    </ConfirmacaoContext.Provider>
  );
}

export function useConfirmacao() {
  const confirmar = useContext(ConfirmacaoContext);
  if (!confirmar) {
    throw new Error("useConfirmacao precisa estar dentro de ConfirmacaoProvider");
  }
  return confirmar;
}
