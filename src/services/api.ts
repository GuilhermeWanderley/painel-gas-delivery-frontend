import axios, { type AxiosError } from "axios";
import type {
  Pedido,
  Entregador,
  OrderStatus,
  OrderType,
  PaymentMethod,
  StatusPagamento,
  ApiErrorResponse,
  CaixaTurno,
  CaixaAtualResponse,
  Configuracao,
  Transbordo,
  ContadorAtendimentos,
} from "../types";
import { cabecalhoAutorizacao, notificarNaoAutorizado, basicPara } from "./auth";
import { INITIAL_MOCK_ENTREGADORES, INITIAL_MOCK_PEDIDOS } from "./mockData";

const STORAGE_KEY_API_URL = "gas_api_url";
const STORAGE_KEY_USE_MOCK = "gas_use_mock";
const STORAGE_KEY_MOCK_PEDIDOS = "gas_mock_pedidos_data";
const STORAGE_KEY_MOCK_ENTREGADORES = "gas_mock_entregadores_data";

export const getApiBaseUrl = (): string => {
  return (
    localStorage.getItem(STORAGE_KEY_API_URL) ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8080"
  );
};

export const setApiBaseUrl = (url: string) => {
  localStorage.setItem(STORAGE_KEY_API_URL, url);
  axiosClient.defaults.baseURL = url;
};

export const isMockEnabled = (): boolean => {
  const val = localStorage.getItem(STORAGE_KEY_USE_MOCK);
  // Default to false unless explicitly toggled or initialized
  return val === "true";
};

export const setMockEnabled = (enabled: boolean) => {
  localStorage.setItem(STORAGE_KEY_USE_MOCK, enabled ? "true" : "false");
};

export const axiosClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 8000,
});

// Envia o login (HTTP Basic) em todas as chamadas — sem sobrescrever um
// header Authorization definido explicitamente na requisição.
axiosClient.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const autorizacao = cabecalhoAutorizacao();
    if (autorizacao) {
      config.headers.Authorization = autorizacao;
    }
  }
  return config;
});

// Sessão inválida/expirada → o App volta para a tela de login.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      notificarNaoAutorizado();
    }
    return Promise.reject(error);
  },
);

/** Valida usuário/senha contra o backend (usado pela tela de login). */
export async function validarCredenciais(
  usuario: string,
  senha: string,
): Promise<void> {
  await axiosClient.get("/api/admin/pedidos", {
    headers: { Authorization: basicPara(usuario, senha) },
  });
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<ApiErrorResponse>;
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
    if (axiosErr.response?.status === 409) {
      return "Conflito na operação. Verifique o status atual do pedido.";
    }
    if (axiosErr.response?.status === 401) {
      return "Sessão expirada ou credenciais inválidas. Faça login novamente.";
    }
    if (axiosErr.response?.status === 400) {
      return "Dados inválidos enviados para a requisição.";
    }
    if (axiosErr.response?.status === 404) {
      return "Recurso não encontrado no servidor.";
    }
    if (axiosErr.code === "ERR_NETWORK") {
      return 'Não foi possível conectar ao backend (http://localhost:8080). Verifique se o servidor está rodando ou ative o "Modo Simulação" para testar.';
    }
    return axiosErr.message || "Erro inesperado de comunicação com o servidor.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocorreu um erro desconhecido.";
}

// ---- MOCK STORAGE HELPERS ----
function getStoredMockPedidos(): Pedido[] {
  const raw = localStorage.getItem(STORAGE_KEY_MOCK_PEDIDOS);
  if (!raw) {
    localStorage.setItem(
      STORAGE_KEY_MOCK_PEDIDOS,
      JSON.stringify(INITIAL_MOCK_PEDIDOS),
    );
    return INITIAL_MOCK_PEDIDOS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_PEDIDOS;
  }
}

function saveStoredMockPedidos(pedidos: Pedido[]) {
  localStorage.setItem(STORAGE_KEY_MOCK_PEDIDOS, JSON.stringify(pedidos));
}

function getStoredMockEntregadores(): Entregador[] {
  const raw = localStorage.getItem(STORAGE_KEY_MOCK_ENTREGADORES);
  if (!raw) {
    localStorage.setItem(
      STORAGE_KEY_MOCK_ENTREGADORES,
      JSON.stringify(INITIAL_MOCK_ENTREGADORES),
    );
    return INITIAL_MOCK_ENTREGADORES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_ENTREGADORES;
  }
}

function saveStoredMockEntregadores(entregadores: Entregador[]) {
  localStorage.setItem(
    STORAGE_KEY_MOCK_ENTREGADORES,
    JSON.stringify(entregadores),
  );
}

export const resetMockData = () => {
  localStorage.setItem(
    STORAGE_KEY_MOCK_PEDIDOS,
    JSON.stringify(INITIAL_MOCK_PEDIDOS),
  );
  localStorage.setItem(
    STORAGE_KEY_MOCK_ENTREGADORES,
    JSON.stringify(INITIAL_MOCK_ENTREGADORES),
  );
};

// ---- SERVICE API METHODS ----

/** Transições de pagamento PIX aceitas por PUT /api/admin/pedidos/{id}/pagamento. */
export type StatusPagamentoAcao =
  | "COMPROVANTE_ENVIADO"
  | "CONFIRMADO"
  | "ESTORNADO";

/** Corpo do POST /api/admin/pedidos (lançamento manual pelo painel). */
export interface NovoPedidoPayload {
  telefone: string;
  nome: string;
  cpf?: string;
  tipoPedido: OrderType;
  enderecoEntrega: string;
  formaPagamento: PaymentMethod;
  precisaTrocoPara?: number;
}

export const apiService = {
  // Pedidos
  async getPedidos(statusFilter?: OrderStatus): Promise<Pedido[]> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 200));
      const pedidos = getStoredMockPedidos();
      if (statusFilter) {
        return pedidos.filter((p) => p.status === statusFilter);
      }
      return pedidos;
    }

    const params: Record<string, string> = {};
    if (statusFilter) {
      params.status = statusFilter;
    }
    const response = await axiosClient.get<Pedido[]>("/api/admin/pedidos", {
      params,
    });
    return response.data;
  },

  /**
   * Pedidos do caixa ABERTO (somenteTurnoAtual=true).
   * Se o caixa estiver fechado o backend devolve lista vazia — o kanban
   * fica no estado vazio, sem perder o histórico da lista completa.
   */
  async getPedidosDoTurno(): Promise<Pedido[]> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 200));
      return getStoredMockPedidos();
    }

    const response = await axiosClient.get<Pedido[]>("/api/admin/pedidos", {
      params: { somenteTurnoAtual: true },
    });
    return response.data;
  },

  /** Pedidos de um caixa já fechado (consulta do histórico). */
  async getPedidosDoCaixa(caixaId: number): Promise<Pedido[]> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 200));
      return getStoredMockPedidos();
    }

    const response = await axiosClient.get<Pedido[]>(
      `/api/admin/caixa/${caixaId}/pedidos`,
    );
    return response.data;
  },

  async aprovarCpf(pedidoId: number): Promise<void> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 250));
      const pedidos = getStoredMockPedidos();
      const pedido = pedidos.find((p) => p.id === pedidoId);
      if (!pedido) throw new Error("Pedido não encontrado");
      if (pedido.status !== "AGUARDANDO_VALIDACAO_CPF") {
        throw new Error(
          "Somente pedidos aguardando validação de CPF podem ser aprovados.",
        );
      }
      pedido.status = "PENDENTE";
      pedido.dataAtualizacao = new Date().toISOString();
      saveStoredMockPedidos(pedidos);
      return;
    }

    await axiosClient.put(`/api/admin/pedidos/${pedidoId}/aprovar-cpf`);
  },

  async reprovarCpf(pedidoId: number): Promise<void> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 250));
      const pedidos = getStoredMockPedidos();
      const pedido = pedidos.find((p) => p.id === pedidoId);
      if (!pedido) throw new Error("Pedido não encontrado");
      if (pedido.status !== "AGUARDANDO_VALIDACAO_CPF") {
        throw new Error(
          "Somente pedidos aguardando validação de CPF podem ser reprovados.",
        );
      }
      pedido.status = "CPF_REPROVADO";
      pedido.dataAtualizacao = new Date().toISOString();
      saveStoredMockPedidos(pedidos);
      return;
    }

    await axiosClient.put(`/api/admin/pedidos/${pedidoId}/reprovar-cpf`);
  },

  async despacharPedido(pedidoId: number, entregadorId: number): Promise<void> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 250));
      const pedidos = getStoredMockPedidos();
      const entregadores = getStoredMockEntregadores();
      const pedido = pedidos.find((p) => p.id === pedidoId);
      const entregador = entregadores.find((e) => e.id === entregadorId);

      if (!pedido) throw new Error("Pedido não encontrado");
      if (!entregador) throw new Error("Entregador não encontrado");
      if (!entregador.ativo)
        throw new Error("O entregador selecionado está inativo.");
      if (pedido.status !== "PENDENTE") {
        throw new Error(
          "O pedido precisa estar com status PENDENTE para ser despachado.",
        );
      }

      pedido.status = "DESPACHADO";
      pedido.entregador = entregador;
      pedido.dataAtualizacao = new Date().toISOString();
      saveStoredMockPedidos(pedidos);
      return;
    }

    await axiosClient.put(`/api/admin/pedidos/${pedidoId}/despachar`, {
      entregadorId,
    });
  },

  async marcarEntregue(pedidoId: number): Promise<void> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 250));
      const pedidos = getStoredMockPedidos();
      const entregadores = getStoredMockEntregadores();
      const pedido = pedidos.find((p) => p.id === pedidoId);

      if (!pedido) throw new Error("Pedido não encontrado");
      if (pedido.status !== "DESPACHADO") {
        throw new Error(
          "O pedido precisa estar com status DESPACHADO para ser finalizado.",
        );
      }

      pedido.status = "ENTREGUE";
      pedido.dataAtualizacao = new Date().toISOString();

      // Soma no caixa se não for PIX
      if (
        pedido.entregador &&
        (pedido.formaPagamento === "DINHEIRO" ||
          pedido.formaPagamento.startsWith("CARTAO"))
      ) {
        const ent = entregadores.find((e) => e.id === pedido.entregador?.id);
        if (ent) {
          ent.caixaAtual = (ent.caixaAtual || 0) + pedido.valorTotal;
          saveStoredMockEntregadores(entregadores);
        }
      }

      saveStoredMockPedidos(pedidos);
      return;
    }

    await axiosClient.put(`/api/admin/pedidos/${pedidoId}/entregue`);
  },

  async cancelarPedido(pedidoId: number): Promise<void> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 250));
      const pedidos = getStoredMockPedidos();
      const pedido = pedidos.find((p) => p.id === pedidoId);

      if (!pedido) throw new Error("Pedido não encontrado");
      if (
        pedido.status === "ENTREGUE" ||
        pedido.status === "CANCELADO" ||
        pedido.status === "CPF_REPROVADO"
      ) {
        throw new Error(
          "Este pedido já foi finalizado e não pode ser cancelado.",
        );
      }

      pedido.status = "CANCELADO";
      pedido.dataAtualizacao = new Date().toISOString();
      saveStoredMockPedidos(pedidos);
      return;
    }

    await axiosClient.put(`/api/admin/pedidos/${pedidoId}/cancelar`);
  },

  // ---- Pagamento (PIX) ----
  async atualizarStatusPagamento(
    pedidoId: number,
    status: StatusPagamentoAcao,
  ): Promise<void> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 250));
      const pedidos = getStoredMockPedidos();
      const pedido = pedidos.find((p) => p.id === pedidoId);
      if (!pedido) throw new Error("Pedido não encontrado");
      const statusPagamento: StatusPagamento = status;
      pedido.statusPagamento = statusPagamento;
      pedido.dataAtualizacao = new Date().toISOString();
      saveStoredMockPedidos(pedidos);
      return;
    }

    await axiosClient.put(`/api/admin/pedidos/${pedidoId}/pagamento`, {
      status,
    });
  },

  // ---- Lançamento manual de pedido ----
  async criarPedido(data: NovoPedidoPayload): Promise<Pedido> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 250));
      const pedidos = getStoredMockPedidos();
      const agora = new Date().toISOString();
      const novo: Pedido = {
        id: Date.now(),
        cliente: {
          id: Date.now(),
          nome: data.nome,
          telefone: data.telefone,
          cpf: data.cpf ?? null,
          enderecoPadrao: data.enderecoEntrega,
          dataCadastro: agora,
        },
        status:
          data.tipoPedido === "GAS_DO_POVO"
            ? "AGUARDANDO_VALIDACAO_CPF"
            : "PENDENTE",
        tipoPedido: data.tipoPedido,
        formaPagamento: data.formaPagamento,
        statusPagamento: data.formaPagamento === "PIX" ? "AGUARDANDO" : "NAO_APLICAVEL",
        origem: "MANUAL",
        precisaTrocoPara:
          data.formaPagamento === "DINHEIRO"
            ? (data.precisaTrocoPara ?? null)
            : null,
        enderecoEntrega: data.enderecoEntrega,
        valorTotal: 0,
        dataCriacao: agora,
        dataAtualizacao: agora,
        entregador: null,
      };
      pedidos.push(novo);
      saveStoredMockPedidos(pedidos);
      return novo;
    }

    const response = await axiosClient.post<Pedido>(
      "/api/admin/pedidos",
      data,
    );
    return response.data;
  },

  // Entregadores
  async getEntregadores(): Promise<Entregador[]> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 150));
      return getStoredMockEntregadores();
    }
    const response = await axiosClient.get<Entregador[]>("/api/entregadores");
    return response.data;
  },

  async getEntregadoresAtivos(): Promise<Entregador[]> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 150));
      return getStoredMockEntregadores().filter((e) => e.ativo);
    }
    const response = await axiosClient.get<Entregador[]>(
      "/api/admin/entregadores",
    );
    return response.data;
  },

  async cadastrarEntregador(data: {
    nome: string;
    telefone: string;
  }): Promise<Entregador> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 250));
      const entregadores = getStoredMockEntregadores();
      const novo: Entregador = {
        id: Date.now(),
        nome: data.nome,
        telefone: data.telefone,
        ativo: true,
        caixaAtual: 0,
      };
      entregadores.push(novo);
      saveStoredMockEntregadores(entregadores);
      return novo;
    }
    const response = await axiosClient.post<Entregador>(
      "/api/entregadores",
      data,
    );
    return response.data;
  },

  async ativarEntregador(id: number): Promise<void> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 200));
      const entregadores = getStoredMockEntregadores();
      const ent = entregadores.find((e) => e.id === id);
      if (ent) {
        ent.ativo = true;
        saveStoredMockEntregadores(entregadores);
      }
      return;
    }
    await axiosClient.put(`/api/entregadores/${id}/ativar`);
  },

  async desativarEntregador(id: number): Promise<void> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 200));
      const entregadores = getStoredMockEntregadores();
      const ent = entregadores.find((e) => e.id === id);
      if (ent) {
        ent.ativo = false;
        saveStoredMockEntregadores(entregadores);
      }
      return;
    }
    await axiosClient.put(`/api/entregadores/${id}/desativar`);
  },

  async excluirEntregador(id: number): Promise<void> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 200));
      const entregadores = getStoredMockEntregadores().filter(
        (e) => e.id !== id,
      );
      saveStoredMockEntregadores(entregadores);
      return;
    }
    await axiosClient.delete(`/api/entregadores/${id}`);
  },

  // Caixa
  async getCaixaDoDia(): Promise<Record<string, number>> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 150));
      const pedidos = getStoredMockPedidos();
      const result: Record<string, number> = {};

      pedidos.forEach((p) => {
        if (
          p.status === "ENTREGUE" &&
          p.entregador &&
          (p.formaPagamento === "DINHEIRO" ||
            p.formaPagamento === "CARTAO_CREDITO" ||
            p.formaPagamento === "CARTAO_DEBITO")
        ) {
          const key = String(p.entregador.id);
          result[key] = (result[key] || 0) + p.valorTotal;
        }
      });
      return result;
    }

    const response = await axiosClient.get<Record<string, number>>(
      "/api/admin/entregadores/caixa",
    );
    return response.data;
  },

  // ---- Caixa (turno) ----
  async getCaixaAtual(): Promise<CaixaAtualResponse> {
    const response = await axiosClient.get<CaixaAtualResponse>(
      "/api/admin/caixa/atual",
    );
    return response.data;
  },

  async abrirCaixa(abertoPor?: string): Promise<CaixaTurno> {
    const response = await axiosClient.post<CaixaTurno>(
      "/api/admin/caixa/abrir",
      { abertoPor },
    );
    return response.data;
  },

  async fecharCaixa(observacao?: string): Promise<CaixaTurno> {
    const response = await axiosClient.post<CaixaTurno>(
      "/api/admin/caixa/fechar",
      { observacao },
    );
    return response.data;
  },

  async getHistoricoCaixas(): Promise<CaixaTurno[]> {
    const response = await axiosClient.get<CaixaTurno[]>(
      "/api/admin/caixa/historico",
    );
    return response.data;
  },

  // ---- Configuração (preços) ----
  async getConfiguracao(): Promise<Configuracao> {
    const response = await axiosClient.get<Configuracao>(
      "/api/admin/configuracao",
    );
    return response.data;
  },

  async atualizarConfiguracao(cfg: Configuracao): Promise<Configuracao> {
    const response = await axiosClient.put<Configuracao>(
      "/api/admin/configuracao",
      cfg,
    );
    return response.data;
  },

  // ---- Atendimento humano (transbordo) ----
  async getAtendimentosPendentes(): Promise<Transbordo[]> {
    if (isMockEnabled()) return [];
    const response = await axiosClient.get<Transbordo[]>(
      "/api/admin/atendimento/pendentes",
    );
    return response.data;
  },

  async getContadorAtendimentos(): Promise<ContadorAtendimentos> {
    if (isMockEnabled()) return { pendentes: 0 };
    const response = await axiosClient.get<ContadorAtendimentos>(
      "/api/admin/atendimento/pendentes/contador",
    );
    return response.data;
  },

  async atenderAtendimento(id: number): Promise<Transbordo> {
    const response = await axiosClient.put<Transbordo>(
      `/api/admin/atendimento/${id}/atender`,
    );
    return response.data;
  },
};
