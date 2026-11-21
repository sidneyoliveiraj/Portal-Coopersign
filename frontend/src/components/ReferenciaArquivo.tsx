import { Anchor, Text } from "@mantine/core";
import { ehLink } from "../formato";

// Link vira "Abrir arquivo" (abre o WeTransfer/Drive/OneDrive em outra aba, onde se baixa a arte);
// texto livre (ex.: "WhatsApp do Charles") aparece como está.
// "compacto" (tabela da Fila) limita a 2 linhas; o texto inteiro aparece ao passar o mouse.
export function ReferenciaArquivo({ referencia, compacto = false }: { referencia: string; compacto?: boolean }) {
  if (ehLink(referencia)) {
    return (
      <Anchor href={referencia.trim()} target="_blank" rel="noreferrer" size="sm" title={referencia}>
        Abrir arquivo
      </Anchor>
    );
  }
  if (compacto) {
    return (
      <Text size="sm" lineClamp={2} title={referencia} style={{ wordBreak: "break-all" }}>
        {referencia}
      </Text>
    );
  }
  return (
    <Text span size="sm">
      {referencia}
    </Text>
  );
}
