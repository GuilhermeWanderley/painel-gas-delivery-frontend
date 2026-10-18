import React from "react";
import {
  Banknote,
  CreditCard,
  QrCode,
  Clock,
  FileCheck,
  CircleCheck,
  Undo2,
  RotateCcw,
} from "lucide-react";
import type { PaymentMethod, StatusPagamento } from "../../types";
import {
  PAYMENT_METHOD_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from "../../utils/formatters";

/**
 * Selo padronizado da forma de pagamento (ícone + rótulo).
 * Substitui os antigos glifos de texto por ícones vetoriais consistentes.
 */
export const PaymentBadge: React.FC<{
  forma: PaymentMethod;
  className?: string;
}> = ({ forma, className = "" }) => {
  const conf = PAYMENT_METHOD_CONFIG[forma];
  const Icon =
    forma === "DINHEIRO" ? Banknote : forma === "PIX" ? QrCode : CreditCard;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[5px] border font-medium text-[12px] ${conf.badgeClass} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 text-slate-500" />
      <span>{conf.label}</span>
    </span>
  );
};

const STATUS_ICON = {
  AGUARDANDO: Clock,
  COMPROVANTE_ENVIADO: FileCheck,
  CONFIRMADO: CircleCheck,
  A_ESTORNAR: Undo2,
  ESTORNADO: RotateCcw,
} as const;

/**
 * Selo do andamento do pagamento (PIX), mesma estrutura do PaymentBadge.
 * NAO_APLICAVEL (ou ausente) não renderiza nada — não ocupa espaço.
 */
export const PaymentStatusBadge: React.FC<{
  status?: StatusPagamento | null;
  className?: string;
}> = ({ status, className = "" }) => {
  if (!status || status === "NAO_APLICAVEL") return null;
  const conf = PAYMENT_STATUS_CONFIG[status];
  if (!conf) return null;
  const Icon = STATUS_ICON[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[5px] border font-medium text-[12px] max-w-full ${conf.badgeClass} ${className}`}
      title={`Pagamento: ${conf.label}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="truncate">{conf.label}</span>
    </span>
  );
};
