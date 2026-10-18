import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Headset, Mic, MessageCircle, UserRound, X } from "lucide-react";
import { apiService, getErrorMessage } from "../../services/api";
import type { MotivoTransbordo, Transbordo } from "../../types";
import { formatJid, formatTimeAgo } from "../../utils/formatters";
import { useToast } from "../common/ToastContext";

export const ATENDIMENTOS_QUERY_KEY = ["atendimentos-pendentes"] as const;

const MOTIVO_CONFIG: Record<
  MotivoTransbordo,
  { label: string; badgeClass: string; Icon: typeof Headset }
> = {
  ATENDENTE: { label: "Pediu atendente", badgeClass: "badge-warn", Icon: Headset },
  AUDIO: { label: "Enviou áudio", badgeClass: "badge-neutral", Icon: Mic },
};

interface AtendimentoAlertaProps {
  aberto: boolean;
  onFechar: () => void;
  pendentes: Transbordo[];
}

/**
 * Painel lateral com a lista de atendimentos que o robô não conseguiu
 * reconhecer. A contagem e o bipe vivem em `useAtendimentosPendentes`; aqui
 * só existe a gaveta, aberta pelo sino da navbar.
 */
export const AtendimentoAlerta: React.FC<AtendimentoAlertaProps> = ({
  aberto,
  onFechar,
  pendentes,
}) => {
  // Re-renderiza a cada minuto para o "há N min" andar sozinho.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!aberto) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, onFechar]);

  return (
    <div
      className={`fixed inset-0 z-50 ${aberto ? "" : "pointer-events-none"}`}
      aria-hidden={!aberto}
    >
      {/* Fundo: clicar fora fecha */}
      <div
        onClick={onFechar}
        className={`absolute inset-0 bg-slate-900/20 transition-opacity duration-200 ${
          aberto ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-atendimentos"
        inert={!aberto}
        className={`absolute right-0 top-0 h-full w-[380px] max-w-full bg-surface border-l border-line shadow-xs flex flex-col transition-transform duration-200 ${
          aberto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="h-14 px-4 flex items-center justify-between border-b border-line shrink-0">
          <div>
            <h2 id="titulo-atendimentos" className="text-[15px]">
              Atendimentos pendentes
            </h2>
            <p className="page-subtitle tnum">
              {pendentes.length === 0
                ? "Nenhum cliente aguardando"
                : `${pendentes.length} cliente(s) aguardando resposta`}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="btn btn-icon"
            title="Fechar"
            aria-label="Fechar painel"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-canvas">
          {pendentes.length === 0 ? (
            <div className="kanban-empty py-10 text-center text-[13px]">
              Tudo em dia por aqui.
            </div>
          ) : (
            pendentes.map((t) => <ItemAtendimento key={t.id} item={t} />)
          )}
        </div>
      </aside>
    </div>
  );
};

// ---------------------------------------------------------------------------

function ItemAtendimento({ item }: { item: Transbordo }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [enviando, setEnviando] = useState(false);

  const fone = formatJid(item.telefone);
  const motivo = MOTIVO_CONFIG[item.motivo] ?? {
    label: String(item.motivo),
    badgeClass: "badge-neutral",
    Icon: MessageCircle,
  };
  const MotivoIcon = motivo.Icon;

  const atender = async () => {
    setEnviando(true);
    try {
      await apiService.atenderAtendimento(item.id);
      // Remove na hora; o refetch confirma com o backend em seguida.
      qc.setQueryData<Transbordo[]>(ATENDIMENTOS_QUERY_KEY, (old) =>
        old ? old.filter((t) => t.id !== item.id) : [],
      );
      await qc.invalidateQueries({ queryKey: ATENDIMENTOS_QUERY_KEY });
    } catch (e) {
      toast.error(getErrorMessage(e), "Erro ao Atender");
      setEnviando(false);
    }
  };

  return (
    <div className="card p-3">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-sunken flex items-center justify-center text-ink-soft shrink-0">
          <UserRound className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[13px] font-semibold truncate ${
                item.nome ? "text-ink" : "text-ink-soft italic"
              }`}
              title={item.nome ?? undefined}
            >
              {item.nome || "Sem nome"}
            </span>
            <time
              dateTime={item.dataCriacao}
              className="text-[11px] text-ink-faint shrink-0"
            >
              {formatTimeAgo(item.dataCriacao)}
            </time>
          </div>
          <div className="tnum flex items-center gap-1.5 text-[12px] text-ink-soft min-w-0">
            <span className="truncate" title={item.telefone}>
              {fone.texto}
            </span>
            {!fone.isLid && fone.digitos && (
              <a
                href={`https://wa.me/${fone.digitos}`}
                target="_blank"
                rel="noreferrer"
                title="Abrir conversa no WhatsApp"
                className="text-ink-faint hover:text-ink transition-colors shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className={`badge ${motivo.badgeClass}`}>
          <MotivoIcon className="w-3 h-3" />
          {motivo.label}
        </span>
        <button
          onClick={atender}
          disabled={enviando}
          className="btn btn-primary h-8 px-3"
        >
          {enviando ? "Atendendo..." : "Atender"}
        </button>
      </div>
    </div>
  );
}
