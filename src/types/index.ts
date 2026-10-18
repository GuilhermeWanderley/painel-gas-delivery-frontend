export type OrderStatus =
  | "AGUARDANDO_VALIDACAO_CPF"
  | "PENDENTE"
  | "DESPACHADO"
  | "ENTREGUE"
  | "CPF_REPROVADO"
  | "CANCELADO";

export type OrderType = "NORMAL" | "GAS_DO_POVO";

export type PaymentMethod =
  "DINHEIRO" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "PIX";

export interface Cliente {
  id: number;
  telefone: string;
  nome: string;
  cpf?: string | null;
  enderecoPadrao?: string | null;
  dataCadastro?: string;
}

export interface Entregador {
  id: number;
  nome: string;
  telefone: string;
  ativo: boolean;
  caixaAtual?: number;
}

export interface Pedido {
  id: number;
  cliente: Cliente;
  status: OrderStatus;
  tipoPedido: OrderType;
  formaPagamento: PaymentMethod;
  precisaTrocoPara?: number | null;
  enderecoEntrega: string;
  valorTotal: number;
  dataCriacao: string;
  dataAtualizacao: string;
  entregador?: Entregador | null;
}

export type CaixaDiario = Record<string, number>;

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
}

// ===================== CAIXA (turno) =====================

export interface ResumoCaixaEntregador {
  id: number;
  entregadorId: number | null;
  entregadorNome: string;
  quantidadePedidos: number;
  totalDinheiro: number;
  totalCartao: number;
  totalPix: number;
  total: number;
}

export type CaixaStatus = "ABERTO" | "FECHADO";

export interface CaixaTurno {
  id: number;
  dataAbertura: string;
  dataFechamento: string | null;
  status: CaixaStatus;
  abertoPor?: string | null;
  observacao?: string | null;
  totalGeral: number;
  totalDinheiro: number;
  totalCartao: number;
  totalPix: number;
  quantidadePedidos: number;
  resumo: ResumoCaixaEntregador[];
}

export interface CaixaAtualResponse {
  aberto: boolean;
  caixa: CaixaTurno | null;
}

// ===================== CONFIGURAÇÃO (preços) =====================

export interface Configuracao {
  id: number;
  precoGasVista: number;
  precoGasCredito: number;
  precoGasPovo: number;
  descontoQuarta: number;
  promocaoQuartaAtiva: boolean;
  /** Chave PIX pública enviada pelo robô ao cliente. Vazio = null. */
  chavePix: string | null;
}

// ===================== ATENDIMENTO HUMANO (transbordo) =====================

export type MotivoTransbordo = "ATENDENTE" | "AUDIO";

export type StatusTransbordo = "PENDENTE" | "ATENDIDO" | "CANCELADO";

export interface Transbordo {
  id: number;
  /** Pode vir como "5575...@s.whatsapp.net", "...@lid" ou só dígitos. */
  telefone: string;
  nome: string | null;
  motivo: MotivoTransbordo;
  status: StatusTransbordo;
  /** ISO */
  dataCriacao: string;
  dataAtendimento: string | null;
}

export interface ContadorAtendimentos {
  pendentes: number;
}
