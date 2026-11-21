import { Image } from "@mantine/core";

export function Logo({ tamanho }: { tamanho: number }) {
  return <Image src="/logo-coopersign.png" alt="Coopersign" w={tamanho} h={tamanho} />;
}
