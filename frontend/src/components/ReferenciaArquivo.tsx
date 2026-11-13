import { Anchor, Text } from "@mantine/core";
import { ehLink } from "../formato";

// Link vira "Abrir arquivo"; texto livre (ex.: "WhatsApp do Charles") aparece como está.
export function ReferenciaArquivo({ referencia }: { referencia: string }) {
  if (ehLink(referencia)) {
    return (
      <Anchor href={referencia.trim()} target="_blank" rel="noreferrer" size="sm">
        Abrir arquivo
      </Anchor>
    );
  }
  return (
    <Text span size="sm">
      {referencia}
    </Text>
  );
}
