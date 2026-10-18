import React, { useState } from "react";
import type { Pedido } from "../../types";
import {
  formatCurrency,
  formatPhone,
  formatCPF,
  formatTimeAgo,
} from "../../utils/formatters";
import { PaymentBadge } from "../common/PaymentBadge";
import {
  User,
  MapPin,
  Clock,
  Bike,
  Copy,
  Check,
  Flame,
  PhoneCall,
  Banknote,
  Ban,
} from "lucide-react";

interface PedidoCardProps {
  pedido: Pedido;
  onAprovarCpf: (pedido: Pedido) => void;
  onReprovarCpf: (pedido: Pedido) => void;
  onDespachar: (pedido: Pedido) => void;
  onMarcarEntregue: (pedido: Pedido) => void;
  onCancelar: (pedido: Pedido) => void;
}

export const PedidoCard: React.FC<PedidoCardProps> = ({
  pedido,
  onAprovarCpf,
  onReprovarCpf,
  onDespachar,
  onMarcarEntregue,
  onCancelar,
}) => {
  const [copiedCpf, setCopiedCpf] = useState(false);

  const handleCopyCpf = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pedido.cliente.cpf) {
      navigator.clipboard.writeText(pedido.cliente.cpf);
      setCopiedCpf(true);
      setTimeout(() => setCopiedCpf(false), 2000);
    }
  };

  const isGasDoPovo = pedido.tipoPedido === "GAS_DO_POVO";

  return (
    <div
      className={`group relative bg-white rounded-md border border-slate-200 hover:border-slate-300 transition-colors shadow-xs p-3.5`}
    >
      {/* Top badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="badge tnum font-mono">#{pedido.id}</span>
          {isGasDoPovo ? (
            <span className="badge badge-purple">
              <Flame className="w-3 h-3" />
              Gás do Povo
            </span>
          ) : (
            <span className="badge">Normal</span>
          )}
        </div>

        <div className="tnum flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(pedido.dataCriacao)}</span>
        </div>
      </div>

      {/* Cliente */}
      <div className="mb-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-[13px] text-slate-900 leading-snug line-clamp-1">
                {pedido.cliente.nome}
              </div>
              <div className="tnum flex items-center gap-2 text-[12px] text-slate-500">
                <span>{formatPhone(pedido.cliente.telefone)}</span>
                {pedido.cliente.telefone && (
                  <a
                    href={`https://wa.me/${pedido.cliente.telefone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Conversar no WhatsApp"
                    className="text-slate-400 hover:text-slate-900 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PhoneCall className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Highlight de CPF no Gás do Povo */}
        {isGasDoPovo && pedido.cliente.cpf && (
          <div className="mt-2 bg-slate-50 border border-slate-200 rounded-sm px-2.5 py-1.5 flex items-center justify-between text-[13px]">
            <div>
              <span className="text-slate-500">CPF: </span>
              <span className="tnum font-semibold text-slate-900">
                {formatCPF(pedido.cliente.cpf)}
              </span>
            </div>
            <button
              onClick={handleCopyCpf}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
              title="Copiar CPF"
            >
              {copiedCpf ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Endereço */}
      <div className="flex items-start gap-2 mb-3 bg-slate-50 border border-slate-100 rounded-sm px-2.5 py-1.5 text-[13px] text-slate-700">
        <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
        <span className="leading-snug line-clamp-2">
          {pedido.enderecoEntrega}
        </span>
      </div>

      {/* Entregador atribuído (se despachado ou entregue) */}
      {pedido.entregador && (
        <div className="flex items-center gap-2 mb-3 bg-slate-50 border border-slate-100 rounded-sm px-2.5 py-1.5 text-[13px] text-slate-700">
          <Bike className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <div className="truncate">
            <span className="text-slate-500">Entregador: </span>
            <strong className="font-medium text-slate-900">
              {pedido.entregador.nome}
            </strong>
          </div>
        </div>
      )}

      {/* Financeiro e Pagamento */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mb-3">
        <div>
          <span className="label block">TOTAL</span>
          <span className="tnum font-bold text-slate-900 text-[16px] leading-tight">
            {formatCurrency(pedido.valorTotal)}
          </span>
        </div>

        <div className="text-right">
          <PaymentBadge forma={pedido.formaPagamento} />
          {pedido.precisaTrocoPara && (
            <div className="tnum text-[11px] font-medium text-slate-500 mt-1 flex items-center justify-end gap-1">
              <Banknote className="w-3 h-3 text-slate-400" />
              Troco p/ {formatCurrency(pedido.precisaTrocoPara)}
            </div>
          )}
        </div>
      </div>

      {/* Ações contextuais conforme Seção 6 da Documentação */}
      <div className="flex items-center gap-1 pt-3 border-t border-slate-100">
        {/* Status: AGUARDANDO_VALIDACAO_CPF */}
        {pedido.status === "AGUARDANDO_VALIDACAO_CPF" && (
          <div className="w-full flex items-center gap-1">
            <button
              onClick={() => onAprovarCpf(pedido)}
              className="btn btn-primary flex-1 min-w-0 px-1.5"
              title="Aprovar CPF para despacho"
            >
              <span className="truncate">Aprovar CPF</span>
            </button>
            <button
              onClick={() => onReprovarCpf(pedido)}
              className="btn btn-danger shrink-0 px-2.5"
              title="Reprovar CPF e encerrar pedido"
            >
              <span>Reprovar</span>
            </button>
            <button
              onClick={() => onCancelar(pedido)}
              className="btn btn-icon h-8 w-8 shrink-0 text-slate-400 hover:text-rose-600"
              title="Cancelar Pedido"
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status: PENDENTE */}
        {pedido.status === "PENDENTE" && (
          <div className="w-full flex items-center gap-1">
            <button
              onClick={() => onDespachar(pedido)}
              className="btn btn-primary flex-1 min-w-0"
            >
              <span>Despachar</span>
            </button>
            <button
              onClick={() => onCancelar(pedido)}
              className="btn btn-icon h-8 w-8 shrink-0 text-slate-400 hover:text-rose-600"
              title="Cancelar Pedido"
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status: DESPACHADO */}
        {pedido.status === "DESPACHADO" && (
          <div className="w-full flex items-center gap-1">
            <button
              onClick={() => onMarcarEntregue(pedido)}
              className="btn btn-primary flex-1 min-w-0"
            >
              <span>Marcar Entregue</span>
            </button>
            <button
              onClick={() => onCancelar(pedido)}
              className="btn btn-icon h-8 w-8 shrink-0 text-slate-400 hover:text-rose-600"
              title="Cancelar Pedido"
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status Finalizados: ENTREGUE, CPF_REPROVADO, CANCELADO */}
        {(pedido.status === "ENTREGUE" ||
          pedido.status === "CPF_REPROVADO" ||
          pedido.status === "CANCELADO") && (
          <div className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 text-center text-[12px] font-medium text-slate-500">
            {pedido.status === "ENTREGUE" && "Pedido finalizado com sucesso"}
            {pedido.status === "CPF_REPROVADO" &&
              "Benefício negado (CPF reprovado)"}
            {pedido.status === "CANCELADO" && "Pedido cancelado"}
          </div>
        )}
      </div>
    </div>
  );
};
