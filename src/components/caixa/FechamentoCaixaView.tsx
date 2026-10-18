import React, { useCallback, useEffect, useState } from "react";
import { apiService, getErrorMessage } from "../../services/api";
import type {
  CaixaAtualResponse,
  CaixaTurno,
  Pedido,
  ResumoCaixaEntregador,
} from "../../types";
import {
  formatCurrency,
  formatDateTime,
  STATUS_CONFIG,
} from "../../utils/formatters";
import { useToast } from "../common/ToastContext";
import {
  Wallet,
  Play,
  Square,
  History,
  Printer,
  Coins,
  CreditCard,
  Building,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Lock,
} from "lucide-react";

interface FechamentoCaixaViewProps {
  onRefresh: () => void;
}

export const FechamentoCaixaView: React.FC<FechamentoCaixaViewProps> = ({
  onRefresh,
}) => {
  const toast = useToast();
  const [atual, setAtual] = useState<CaixaAtualResponse | null>(null);
  const [historico, setHistorico] = useState<CaixaTurno[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Histórico: expansão dos pedidos de um caixa fechado.
  const [caixaExpandido, setCaixaExpandido] = useState<number | null>(null);
  const [pedidosPorCaixa, setPedidosPorCaixa] = useState<
    Record<number, Pedido[]>
  >({});
  const [caixasCarregando, setCaixasCarregando] = useState<number[]>([]);
  const [erroPedidosCaixa, setErroPedidosCaixa] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [a, h] = await Promise.all([
        apiService.getCaixaAtual(),
        apiService.getHistoricoCaixas(),
      ]);
      setAtual(a);
      setHistorico(h);
    } catch (e) {
      toast.error(getErrorMessage(e), "Erro ao Carregar");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrir = async () => {
    setBusy(true);
    try {
      await apiService.abrirCaixa("Operador");
      toast.success("Caixa aberto! O turno foi iniciado.", "Caixa Aberto");
      await carregar();
      onRefresh();
    } catch (e) {
      toast.error(getErrorMessage(e), "Erro ao Abrir");
    } finally {
      setBusy(false);
    }
  };

  const fechar = async () => {
    setBusy(true);
    try {
      await apiService.fecharCaixa();
      toast.success(
        "Caixa fechado! Relatório do turno congelado.",
        "Caixa Fechado",
      );
      await carregar();
      onRefresh();
    } catch (e) {
      toast.error(getErrorMessage(e), "Erro ao Fechar");
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = () => window.print();

  // Abre/fecha a lista de pedidos de um caixa do histórico. Os pedidos são
  // buscados uma única vez por caixa e ficam em cache no estado local.
  const alternarPedidosCaixa = async (caixaId: number) => {
    if (caixaExpandido === caixaId) {
      setCaixaExpandido(null);
      return;
    }

    setCaixaExpandido(caixaId);
    setErroPedidosCaixa(null);

    if (pedidosPorCaixa[caixaId]) return;

    setCaixasCarregando((anterior) => [...anterior, caixaId]);
    try {
      const pedidos = await apiService.getPedidosDoCaixa(caixaId);
      setPedidosPorCaixa((anterior) => ({ ...anterior, [caixaId]: pedidos }));
    } catch (e) {
      setErroPedidosCaixa(getErrorMessage(e));
    } finally {
      setCaixasCarregando((anterior) =>
        anterior.filter((id) => id !== caixaId),
      );
    }
  };

  const aberto = !!atual?.aberto;
  const caixa = atual?.caixa ?? null;

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-500">
        Carregando caixa...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de status do turno */}
      <div
        className={`p-6 rounded-lg border shadow-xs ${
          aberto
            ? "bg-blue-50/60 border-blue-200"
            : "bg-amber-50/60 border-amber-300"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                aberto ? "bg-blue-600 text-white" : "bg-amber-500 text-white"
              }`}
            >
              {aberto ? (
                <Wallet className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {aberto ? "Caixa ABERTO" : "Caixa FECHADO"}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {aberto && caixa
                  ? `Turno aberto desde ${formatDateTime(caixa.dataAbertura)}${caixa.abertoPor ? ` por ${caixa.abertoPor}` : ""}`
                  : "Nenhum turno em andamento. Abra o caixa para começar a atender."}
              </p>
            </div>
          </div>

          <button
            onClick={aberto ? fechar : abrir}
            disabled={busy}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg text-white shadow-md transition disabled:opacity-60 ${
              aberto
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
            }`}
          >
            {aberto ? (
              <Square className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {busy ? "Processando..." : aberto ? "Fechar Caixa" : "Abrir Caixa"}
          </button>
        </div>
      </div>

      {/* Aviso de atendimento sem caixa aberto */}
      {!aberto && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Atenção:</strong> o caixa está
            fechado. Não aceite pedidos antes de abrir o caixa.
          </div>
        </div>
      )}

      {/* Resumo do turno atual */}
      {aberto && caixa && <ResumoTurno caixa={caixa} />}

      {/* Histórico */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            Histórico de Caixas ({historico.length})
          </h3>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
        </div>

        {historico.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400 italic">
            Nenhum caixa registrado ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historico.map((c) => {
              const expandido = caixaExpandido === c.id;
              const pedidosCaixa = pedidosPorCaixa[c.id];
              const carregandoCaixa = caixasCarregando.includes(c.id);

              return (
                <div key={c.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md ${
                          c.status === "ABERTO"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        Caixa #{c.id} ·{" "}
                        {c.status === "ABERTO" ? "Aberto" : "Fechado"}
                      </span>
                      <div className="text-xs text-slate-500 mt-1.5">
                        {formatDateTime(c.dataAbertura)} →{" "}
                        {formatDateTime(c.dataFechamento)}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Total do turno
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        {formatCurrency(c.totalGeral)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.quantidadePedidos} pedido(s) · Dinheiro{" "}
                        {formatCurrency(c.totalDinheiro)} · Cartão{" "}
                        {formatCurrency(c.totalCartao)} · Pix{" "}
                        {formatCurrency(c.totalPix)}
                      </div>
                    </div>
                  </div>

                  {/* Relatório congelado por entregador */}
                  {c.resumo.length > 0 && (
                    <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200/60">
                      <div className="text-xs font-bold text-slate-600 mb-2">
                        Relatório congelado por entregador:
                      </div>
                      <div className="space-y-1.5">
                        {c.resumo.map((l) => (
                          <LinhaResumo key={l.id} linha={l} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pedidos do caixa (carregados sob demanda) */}
                  <div className="mt-3">
                    <button
                      onClick={() => alternarPedidosCaixa(c.id)}
                      className="btn btn-secondary h-8 px-3 text-xs"
                      aria-expanded={expandido}
                    >
                      {expandido ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                      {expandido
                        ? "Ocultar pedidos"
                        : `Ver pedidos (${c.quantidadePedidos})`}
                    </button>

                    {expandido && (
                      <div className="mt-3 card overflow-hidden">
                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-600">
                            Pedidos do caixa #{c.id}
                          </span>
                          {carregandoCaixa && (
                            <span className="text-[11px] text-slate-400">
                              Carregando...
                            </span>
                          )}
                        </div>

                        {erroPedidosCaixa ? (
                          <div className="px-3 py-4 text-xs text-rose-700">
                            {erroPedidosCaixa}
                          </div>
                        ) : carregandoCaixa ? (
                          <div className="px-3 py-4 text-xs text-slate-400">
                            Buscando pedidos do caixa...
                          </div>
                        ) : !pedidosCaixa || pedidosCaixa.length === 0 ? (
                          <div className="px-3 py-4 text-xs text-slate-400 italic">
                            Nenhum pedido registrado neste caixa.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                                  <th className="py-2 px-3">ID</th>
                                  <th className="py-2 px-3">Cliente</th>
                                  <th className="py-2 px-3">Tipo</th>
                                  <th className="py-2 px-3">Valor</th>
                                  <th className="py-2 px-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {pedidosCaixa.map((p) => {
                                  const statusConf = STATUS_CONFIG[p.status];
                                  return (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                        #{p.id}
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">
                                        {p.cliente.nome}
                                      </td>
                                      <td className="py-2 px-3">
                                        <span className="badge badge-neutral">
                                          {p.tipoPedido === "GAS_DO_POVO"
                                            ? "Gás do Povo"
                                            : "Normal"}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 font-semibold text-slate-900">
                                        {formatCurrency(p.valorTotal)}
                                      </td>
                                      <td className="py-2 px-3">
                                        <span
                                          className={`badge ${statusConf.badgeClass}`}
                                        >
                                          {statusConf.label}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

function ResumoTurno({ caixa }: { caixa: CaixaTurno }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardResumo
          icon={<Coins className="w-5 h-5" />}
          titulo="Dinheiro"
          valor={caixa.totalDinheiro}
        />
        <CardResumo
          icon={<CreditCard className="w-5 h-5" />}
          titulo="Cartão"
          valor={caixa.totalCartao}
        />
        <CardResumo
          icon={<Building className="w-5 h-5" />}
          titulo="Pix (na conta)"
          valor={caixa.totalPix}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-800">
            Total do turno (em andamento)
          </h3>
          <span className="text-2xl font-black text-slate-900">
            {formatCurrency(caixa.totalGeral)}
          </span>
        </div>
        {caixa.resumo.length > 0 ? (
          <div className="space-y-1.5">
            {caixa.resumo.map((l) => (
              <LinhaResumo key={l.id} linha={l} />
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">
            Nenhuma entrega concluída neste turno ainda.
          </div>
        )}
      </div>
    </div>
  );
}

function CardResumo({
  icon,
  titulo,
  valor,
}: {
  icon: React.ReactNode;
  titulo: string;
  valor: number;
}) {
  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-xs">
      <div className="flex items-center gap-2 text-slate-600 mb-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">
          {titulo}
        </span>
      </div>
      <div className="text-2xl font-black text-slate-900">
        {formatCurrency(valor)}
      </div>
    </div>
  );
}

function LinhaResumo({ linha }: { linha: ResumoCaixaEntregador }) {
  return (
    <div className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-slate-200">
      <span className="font-bold text-slate-800">
        {linha.entregadorNome}
        <span className="text-slate-400 font-normal">
          {" "}
          · {linha.quantidadePedidos} pedido(s)
        </span>
      </span>
      <div className="flex items-center gap-3 text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Coins className="w-3.5 h-3.5 text-slate-400" />
          {formatCurrency(linha.totalDinheiro)}
        </span>
        <span className="inline-flex items-center gap-1">
          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
          {formatCurrency(linha.totalCartao)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          {formatCurrency(linha.totalPix)}
        </span>
        <span className="font-black text-slate-900">
          {formatCurrency(linha.total)}
        </span>
      </div>
    </div>
  );
}
