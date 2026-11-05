import { Badge } from "@mantine/core";
import { CadastroPage, type Item } from "../components/CadastroPage";
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

  return (
    <CadastroPage
      titulo="Usuários"
      singular="Usuário"
      caminho="/usuarios"
      chaveLista="usuarios"
      podeRemover={false}
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
  );
}
