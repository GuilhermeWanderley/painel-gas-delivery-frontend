import React from "react";
import { UserRound } from "lucide-react";
import type { OrigemPedido } from "../../types";

/**
 * Indicador discreto de origem do pedido.
 * BOT é o fluxo normal e não exibe nada; só MANUAL ganha selo.
 */
export const OrigemBadge: React.FC<{
  origem?: OrigemPedido | null;
  className?: string;
}> = ({ origem, className = "" }) => {
  if (origem !== "MANUAL") return null;

  return (
    <span
      className={`badge ${className}`}
      title="Lançado pelo atendente"
      aria-label="Pedido lançado pelo atendente"
    >
      <UserRound className="w-3 h-3" />
      Manual
    </span>
  );
};
