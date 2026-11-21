import { useState } from "react";
import { Alert, Badge, Button } from "@mantine/core";
import { api } from "../api";
import { CadastroPage, type Item } from "../components/CadastroPage";
import { LinkAcessoModal } from "../components/LinkAcesso";
import { useAuth } from "../auth";
import { formatarMoeda } from "../formato";

function texto(valor: unknown) {
  return valor ? String(valor) : "—";
}

export function ClientesPage() {
  return (
    <CadastroPage
      titulo="Clientes"
      singular="Cliente"
      caminho="/clientes"
      chaveLista="clientes"
      campos={[
        { nome: "nome", rotulo: "Nome", obrigatorio: true },
        { nome: "cpfCnpj", rotulo: "CPF/CNPJ" },
        { nome: "contato", rotulo: "Contato" },
        { nome: "endereco", rotulo: "Endereço" },
      ]}
      colunas={[
        { rotulo: "Nome", valor: (i) => texto(i.nome) },
        { rotulo: "CPF/CNPJ", valor: (i) => texto(i.cpfCnpj) },
        { rotulo: "Contato", valor: (i) => texto(i.contato) },
        { rotulo: "Endereço", valor: (i) => texto(i.endereco) },
      ]}
    />
  );
}

export function MateriaisPage() {
  return (
    <CadastroPage
      titulo="Materiais"
      singular="Material"
      caminho="/materiais"
      chaveLista="materiais"
      campos={[
        { nome: "tipo", rotulo: "Tipo", obrigatorio: true },
        { nome: "precoM2", rotulo: "Preço por m² (R$)", tipo: "dinheiro", obrigatorio: true },
      ]}
      colunas={[
        { rotulo: "Tipo", valor: (i) => texto(i.tipo) },
        { rotulo: "Preço por m²", direita: true, valor: (i) => formatarMoeda(String(i.precoM2)) },
      ]}
    />
  );
}

export function ServicosPage() {
  return (
    <CadastroPage
      titulo="Serviços adicionais"
      singular="Serviço adicional"
      caminho="/servicos-adicionais"
      chaveLista="servicosAdicionais"
      campos={[
        { nome: "descricao", rotulo: "Descrição", obrigatorio: true },
        { nome: "valorPadrao", rotulo: "Valor padrão (R$)", tipo: "dinheiro", obrigatorio: true },
      ]}
      colunas={[
        { rotulo: "Descrição", valor: (i) => texto(i.descricao) },
        { rotulo: "Valor padrão", direita: true, valor: (i) => formatarMoeda(String(i.valorPadrao)) },
      ]}
    />
  );
}

const STATUS_MAQUINA: Record<string, { rotulo: string; cor: string }> = {
  ATIVA: { rotulo: "Ativa", cor: "green" },
  EM_MANUTENCAO: { rotulo: "Em manutenção", cor: "yellow" },
  INATIVA: { rotulo: "Inativa", cor: "gray" },
};

function SeloMaquina({ item }: { item: Item }) {
  const status = STATUS_MAQUINA[String(item.status)];
  return (
    <Badge color={status.cor} variant="light">
      {status.rotulo}
    </Badge>
  );
}

export function MaquinasPage() {
  return (
    <CadastroPage
      titulo="Máquinas"
      singular="Máquina"
      caminho="/maquinas"
      chaveLista="maquinas"
      campos={[
        { nome: "nome", rotulo: "Nome", obrigatorio: true },
        { nome: "tipo", rotulo: "Tipo", obrigatorio: true },
        {
          nome: "status",
          rotulo: "Situação",
          tipo: "selecao",
          obrigatorio: true,
          padrao: "ATIVA",
          opcoes: Object.entries(STATUS_MAQUINA).map(([value, { rotulo }]) => ({ value, label: rotulo })),
        },
      ]}
      colunas={[
        { rotulo: "Nome", valor: (i) => texto(i.nome) },
        { rotulo: "Tipo", valor: (i) => texto(i.tipo) },
        { rotulo: "Situação", valor: (i) => <SeloMaquina item={i} /> },
      ]}
    />
  );
}

const PERFIS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  GESTOR: "Gestor",
  OPERADOR: "Operador",
  CLIENTE: "Cliente",
};

export function UsuariosPage() {
  const { usuario } = useAuth();
  const perfis = usuario?.perfil === "ADMINISTRADOR" ? ["ADMINISTRADOR", "GESTOR", "OPERADOR"] : ["GESTOR", "OPERADOR"];
  const [link, setLink] = useState<{ nome: string; token: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function gerarLinkSenha(item: Item) {
    setErro(null);
    try {
      const { token } = await api<{ token: string }>(`/usuarios/${item.id}/link-senha`, { metodo: "POST" });
      setLink({ nome: texto(item.nome), token });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao gerar o link");
    }
  }

  return (
    <>
      {erro && (
        <Alert color="red" mb="md">
          {erro}
        </Alert>
      )}
      <CadastroPage
        titulo="Usuários"
        singular="Usuário"
        caminho="/usuarios"
        chaveLista="usuarios"
        podeRemover={false}
        acaoExtra={(item) => (
          <Button size="xs" variant="subtle" onClick={() => gerarLinkSenha(item)}>
            Link de nova senha
          </Button>
        )}
        campos={[
          { nome: "nome", rotulo: "Nome", obrigatorio: true },
          { nome: "email", rotulo: "E-mail", tipo: "email", obrigatorio: true, somenteAo: "criar" },
          { nome: "senha", rotulo: "Senha inicial", tipo: "senha", obrigatorio: true, somenteAo: "criar" },
          {
            nome: "perfil",
            rotulo: "Perfil",
            tipo: "selecao",
            obrigatorio: true,
            padrao: "OPERADOR",
            opcoes: perfis.map((value) => ({ value, label: PERFIS[value] })),
          },
          { nome: "ativo", rotulo: "Ativo", tipo: "booleano", somenteAo: "editar" },
        ]}
        colunas={[
          { rotulo: "Nome", valor: (i) => texto(i.nome) },
          { rotulo: "E-mail", valor: (i) => texto(i.email) },
          { rotulo: "Perfil", valor: (i) => PERFIS[String(i.perfil)] },
          { rotulo: "Ativo", valor: (i) => (i.ativo ? "Sim" : "Não") },
        ]}
      />
      {link && (
        <LinkAcessoModal
          titulo={`Nova senha: ${link.nome}`}
          explicacao="Mande este link para o usuário criar uma nova senha. Vale por 24 horas."
          token={link.token}
          aoFechar={() => setLink(null)}
        />
      )}
    </>
  );
}
