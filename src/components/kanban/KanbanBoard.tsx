import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Pedido } from "../../types";
import { PedidoCard } from "./PedidoCard";
import {
  apiService,
  type NovoPedidoPayload,
} from "../../services/api";
import { useToast } from "../common/ToastContext";
import { NovoPedidoModal } from "../modals/NovoPedidoModal";
import {
  Search,
  Flame,
  CheckCircle2,
  Clock,
  Bike,
  Archive,
  AlertCircle,
  Filter,
  Plus,
} from "lucide-react";

interface KanbanBoardProps {
  pedidos: Pedido[];
  onAprovarCpf: (pedido: Pedido) => void;
  onReprovarCpf: (pedido: Pedido) => void;
  onDespachar: (pedido: Pedido) => void;
  onMarcarEntregue: (pedido: Pedido) => void;
  onCancelar: (pedido: Pedido) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  pedidos,
  onAprovarCpf,
  onReprovarCpf,
  onDespachar,
  onMarcarEntregue,
  onCancelar,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "ALL" | "GAS_DO_POVO" | "NORMAL"
  >("ALL");
  const [novoPedidoOpen, setNovoPedidoOpen] = useState(false);

  const qc = useQueryClient();
  const toast = useToast();

  const handleCriarPedido = async (data: NovoPedidoPayload) => {
    await apiService.criarPedido(data);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["pedidos"] }),
      qc.invalidateQueries({ queryKey: ["pedidos-turno"] }),
    ]);
    toast.success(
      `Pedido de ${data.nome} lançado com sucesso!`,
      "Novo pedido",
    );
  };

  // Filtragem dos pedidos
  const filteredPedidos = useMemo(() => {
    return pedidos.filter((pedido) => {
      const matchSearch =
        pedido.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pedido.cliente.telefone.includes(searchTerm) ||
        (pedido.cliente.cpf && pedido.cliente.cpf.includes(searchTerm)) ||
        pedido.enderecoEntrega
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(pedido.id).includes(searchTerm);

      const matchType =
        filterType === "ALL" || pedido.tipoPedido === filterType;

      return matchSearch && matchType;
    });
  }, [pedidos, searchTerm, filterType]);

  // Agrupamento em colunas conforme o fluxo de negócio
  const colValidacaoCpf = useMemo(
    () =>
      filteredPedidos.filter((p) => p.status === "AGUARDANDO_VALIDACAO_CPF"),
    [filteredPedidos],
  );

  const colProntoDespacho = useMemo(
    () => filteredPedidos.filter((p) => p.status === "PENDENTE"),
    [filteredPedidos],
  );

  const colNaRua = useMemo(
    () => filteredPedidos.filter((p) => p.status === "DESPACHADO"),
    [filteredPedidos],
  );

  const colFinalizados = useMemo(
    () =>
      filteredPedidos.filter(
        (p) =>
          p.status === "ENTREGUE" ||
          p.status === "CPF_REPROVADO" ||
          p.status === "CANCELADO",
      ),
    [filteredPedidos],
  );

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 px-3.5 py-2.5">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, telefone, CPF, endereço ou #ID..."
            className="input w-full pl-9 pr-3"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Tipo:</span>
            </div>
            <button
              onClick={() => setFilterType("ALL")}
              className={`filter-btn ${filterType === "ALL" ? "filter-btn-active" : ""}`}
            >
              <span className="tnum">Todos ({pedidos.length})</span>
            </button>
            <button
              onClick={() => setFilterType("GAS_DO_POVO")}
              className={`filter-btn ${filterType === "GAS_DO_POVO" ? "filter-btn-active" : ""}`}
            >
              <Flame className="w-3.5 h-3.5" />
              Gás do Povo
            </button>
            <button
              onClick={() => setFilterType("NORMAL")}
              className={`filter-btn ${filterType === "NORMAL" ? "filter-btn-active" : ""}`}
            >
              Normal
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNovoPedidoOpen(true)}
            className="btn btn-primary shrink-0 ml-auto md:ml-0"
            title="Lançar um pedido manualmente"
          >
            <Plus className="w-4 h-4" />
            <span>Novo pedido</span>
          </button>
        </div>
      </div>

      {/* Grid de Colunas Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {/* Coluna 1: Análise de CPF */}
        <div className="kanban-col flex flex-col min-h-[580px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900">
                  Análise de CPF
                </h3>
                <p className="text-[12px] text-slate-500">
                  Benefício Gás do Povo
                </p>
              </div>
            </div>
            <span className="kanban-count tnum inline-flex items-center justify-center">
              {colValidacaoCpf.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
            {colValidacaoCpf.length === 0 ? (
              <div className="kanban-empty h-40 flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mb-1" />
                <p className="text-xs font-medium">
                  Nenhum CPF pendente de análise!
                </p>
              </div>
            ) : (
              colValidacaoCpf.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onAprovarCpf={onAprovarCpf}
                  onReprovarCpf={onReprovarCpf}
                  onDespachar={onDespachar}
                  onMarcarEntregue={onMarcarEntregue}
                  onCancelar={onCancelar}
                />
              ))
            )}
          </div>
        </div>

        {/* Coluna 2: Prontos p/ Despacho */}
        <div className="kanban-col flex flex-col min-h-[580px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900">
                  Para Despachar
                </h3>
                <p className="text-[12px] text-slate-500">
                  Aguardando motoboy
                </p>
              </div>
            </div>
            <span className="kanban-count tnum inline-flex items-center justify-center">
              {colProntoDespacho.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
            {colProntoDespacho.length === 0 ? (
              <div className="kanban-empty h-40 flex flex-col items-center justify-center text-center p-4">
                <Clock className="w-8 h-8 text-slate-300 mb-1" />
                <p className="text-xs font-medium">
                  Nenhum pedido aguardando despacho!
                </p>
              </div>
            ) : (
              colProntoDespacho.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onAprovarCpf={onAprovarCpf}
                  onReprovarCpf={onReprovarCpf}
                  onDespachar={onDespachar}
                  onMarcarEntregue={onMarcarEntregue}
                  onCancelar={onCancelar}
                />
              ))
            )}
          </div>
        </div>

        {/* Coluna 3: Na Rua (Em Rota) */}
        <div className="kanban-col flex flex-col min-h-[580px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900">
                  Na Rua (Em Rota)
                </h3>
                <p className="text-[12px] text-slate-500">
                  Com o entregador
                </p>
              </div>
            </div>
            <span className="kanban-count tnum inline-flex items-center justify-center">
              {colNaRua.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
            {colNaRua.length === 0 ? (
              <div className="kanban-empty h-40 flex flex-col items-center justify-center text-center p-4">
                <Bike className="w-8 h-8 text-slate-300 mb-1" />
                <p className="text-xs font-medium">
                  Nenhuma entrega em rota agora.
                </p>
              </div>
            ) : (
              colNaRua.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onAprovarCpf={onAprovarCpf}
                  onReprovarCpf={onReprovarCpf}
                  onDespachar={onDespachar}
                  onMarcarEntregue={onMarcarEntregue}
                  onCancelar={onCancelar}
                />
              ))
            )}
          </div>
        </div>

        {/* Coluna 4: Finalizados / Concluídos */}
        <div className="kanban-col flex flex-col min-h-[580px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900">
                  Finalizados
                </h3>
                <p className="text-[12px] text-slate-500">
                  Entregues e encerrados
                </p>
              </div>
            </div>
            <span className="kanban-count tnum inline-flex items-center justify-center">
              {colFinalizados.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
            {colFinalizados.length === 0 ? (
              <div className="kanban-empty h-40 flex flex-col items-center justify-center text-center p-4">
                <Archive className="w-8 h-8 text-slate-300 mb-1" />
                <p className="text-xs font-medium">
                  Nenhum pedido finalizado ainda.
                </p>
              </div>
            ) : (
              colFinalizados.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onAprovarCpf={onAprovarCpf}
                  onReprovarCpf={onReprovarCpf}
                  onDespachar={onDespachar}
                  onMarcarEntregue={onMarcarEntregue}
                  onCancelar={onCancelar}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <NovoPedidoModal
        isOpen={novoPedidoOpen}
        onClose={() => setNovoPedidoOpen(false)}
        onConfirm={handleCriarPedido}
      />
    </div>
  );
};
