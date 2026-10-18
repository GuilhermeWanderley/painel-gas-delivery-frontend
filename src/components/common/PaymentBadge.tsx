import React from "react";
import { Banknote, CreditCard, QrCode } from "lucide-react";
import type { PaymentMethod } from "../../types";
import { PAYMENT_METHOD_CONFIG } from "../../utils/formatters";

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
