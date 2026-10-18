import React from "react";
import {
  Flame,
  LayoutGrid,
  Table as TableIcon,
  Bike,
  Wallet,
  BarChart3,
  RefreshCw,
  Settings,
  Database,
  LogOut,
} from "lucide-react";
import { isMockEnabled } from "../../services/api";

export type NavTab =
  "kanban" | "tabela" | "entregadores" | "caixa" | "metricas" | "configuracoes";

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pedidosCountAguardando: number;
  pedidosCountProntos: number;
  isFetching: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  pedidosCountAguardando,
  pedidosCountProntos,
  isFetching,
  onRefresh,
  onOpenSettings,
  onLogout,
}) => {
  const isMock = isMockEnabled();
  const totalAtencao = pedidosCountAguardando + pedidosCountProntos;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Marca — nunca encolhe nem quebra linha */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white shrink-0">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div className="leading-none shrink-0">
              <h1 className="font-semibold text-[14px] leading-none text-slate-900 tracking-tight m-0 whitespace-nowrap">
                Binho do Gás
              </h1>
              <span className="hidden sm:block text-[11px] leading-none text-slate-500 whitespace-nowrap mt-1">
                Painel de Gestão
              </span>
            </div>
          </div>

          {/* Abas — indicador de linha inferior; rolam quando falta espaço */}
          <nav className="flex items-stretch gap-0.5 overflow-x-auto min-w-0 h-14">
            <button
              onClick={() => onTabChange("kanban")}
              className={`tab ${currentTab === "kanban" ? "tab-active" : ""}`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Painel de Pedidos</span>
              {totalAtencao > 0 && (
                <span className="tnum ml-0.5 h-5 min-w-5 px-1.5 inline-flex items-center justify-center rounded-sm bg-slate-200 text-[11px] font-semibold text-slate-700">
                  {totalAtencao}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange("tabela")}
              className={`tab ${currentTab === "tabela" ? "tab-active" : ""}`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Tabela & Histórico</span>
            </button>

            <button
              onClick={() => onTabChange("entregadores")}
              className={`tab ${currentTab === "entregadores" ? "tab-active" : ""}`}
            >
              <Bike className="w-4 h-4" />
              <span>Entregadores</span>
            </button>

            <button
              onClick={() => onTabChange("caixa")}
              className={`tab ${currentTab === "caixa" ? "tab-active" : ""}`}
            >
              <Wallet className="w-4 h-4" />
              <span>Fechamento Caixa</span>
            </button>

            <button
              onClick={() => onTabChange("metricas")}
              className={`tab ${currentTab === "metricas" ? "tab-active" : ""}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Métricas</span>
            </button>

            <button
              onClick={() => onTabChange("configuracoes")}
              className={`tab ${currentTab === "configuracoes" ? "tab-active" : ""}`}
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Indicador de Modo Atual (apenas visualização) */}
            <div
              className={`hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-sm border text-xs font-medium cursor-default select-none ${
                isMock
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {isMock ? (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  <span>Modo Simulação</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Conectado</span>
                </>
              )}
            </div>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              className={`btn btn-icon ${isFetching ? "text-slate-900" : ""}`}
              title="Atualizar pedidos"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="btn btn-icon"
              title="Configurações da API"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Sair */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="btn btn-icon"
                title="Sair do painel"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
