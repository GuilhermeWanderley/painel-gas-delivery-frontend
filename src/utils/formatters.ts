import type {
  OrderStatus,
  OrderType,
  PaymentMethod,
  StatusPagamento,
} from "../types";

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPhone(phone?: string | null): string {
  if (!phone) return "-";
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 13 && clean.startsWith("55")) {
    const ddd = clean.substring(2, 4);
    const num = clean.substring(4);
    return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  }
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

export interface JidFormatado {
  /** Texto pronto para exibição. */
  texto: string;
  /** Só os dígitos do jid (pode ser vazio). */
  digitos: string;
  /**
   * `@lid` é um identificador interno do WhatsApp, não um telefone: não dá
   * para formatar nem abrir conversa por wa.me.
   */
  isLid: boolean;
}

/**
 * Deriva um telefone legível de um remoteJid do WhatsApp.
 * Aceita "5575999998888@s.whatsapp.net", "1234567890@lid" ou só dígitos.
 */
export function formatJid(jid?: string | null): JidFormatado {
  if (!jid) return { texto: "Sem telefone", digitos: "", isLid: false };
  const [usuario, dominio = ""] = jid.split("@");
  const digitos = usuario.split(":")[0].replace(/\D/g, "");
  const isLid = dominio.toLowerCase() === "lid";

  if (isLid || !digitos) {
    return { texto: "Número oculto pelo WhatsApp", digitos, isLid: true };
  }
  // 55 + DDD + 8 dígitos (WhatsApp às vezes omite o nono dígito)
  if (digitos.length === 12 && digitos.startsWith("55")) {
    return {
      texto: `(${digitos.slice(2, 4)}) ${digitos.slice(4, 8)}-${digitos.slice(8)}`,
      digitos,
      isLid,
    };
  }
  const formatado = formatPhone(digitos);
  return { texto: formatado, digitos, isLid };
}

export function formatCPF(cpf?: string | null): string {
  if (!cpf) return "Não informado";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }
  return cpf;
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins === 1) return "Há 1 min";
    if (diffMins < 60) return `Há ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "Há 1 hora";
    if (diffHours < 24) return `Há ${diffHours}h`;

    return formatDateTime(dateStr);
  } catch {
    return "";
  }
}

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string; borderClass: string; bgLight: string }
> = {
  AGUARDANDO_VALIDACAO_CPF: {
    label: "Aguardando CPF",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    borderClass: "border-amber-200",
    bgLight: "bg-amber-50/60",
  },
  PENDENTE: {
    label: "Pronto p/ Despacho",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    borderClass: "border-slate-200",
    bgLight: "bg-slate-50",
  },
  DESPACHADO: {
    label: "Na Rua (Em Rota)",
    badgeClass: "bg-slate-800 text-white border-slate-800",
    borderClass: "border-slate-300",
    bgLight: "bg-slate-50",
  },
  ENTREGUE: {
    label: "Entregue",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderClass: "border-emerald-200",
    bgLight: "bg-emerald-50/60",
  },
  CPF_REPROVADO: {
    label: "CPF Reprovado",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    borderClass: "border-rose-200",
    bgLight: "bg-rose-50/60",
  },
  CANCELADO: {
    label: "Cancelado",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    borderClass: "border-slate-200",
    bgLight: "bg-slate-50",
  },
};

export const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; badgeClass: string }
> = {
  DINHEIRO: {
    label: "Dinheiro",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  },
  CARTAO_CREDITO: {
    label: "Cartão de Crédito",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  },
  CARTAO_DEBITO: {
    label: "Cartão de Débito",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  },
  PIX: {
    label: "PIX",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

/** Andamento do pagamento. NAO_APLICAVEL não tem selo (não é exibido). */
export const PAYMENT_STATUS_CONFIG: Record<
  Exclude<StatusPagamento, "NAO_APLICAVEL">,
  { label: string; badgeClass: string }
> = {
  AGUARDANDO: {
    label: "Aguardando PIX",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  COMPROVANTE_ENVIADO: {
    label: "Comprovante enviado",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  CONFIRMADO: {
    label: "Pago",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  A_ESTORNAR: {
    label: "Estornar",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  ESTORNADO: {
    label: "Estornado",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

export const ORDER_TYPE_CONFIG: Record<
  OrderType,
  { label: string; badgeClass: string }
> = {
  NORMAL: {
    label: "Pedido Normal",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  GAS_DO_POVO: {
    label: "Gás do Povo (Benefício)",
    badgeClass: "bg-purple-100 text-purple-800 font-semibold border-purple-200",
  },
};
