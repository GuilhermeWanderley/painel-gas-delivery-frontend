import React from "react";
import {
  LayoutGrid,
  Table as TableIcon,
  Bike,
  Wallet,
  BarChart3,
  RefreshCw,
  Settings,
  Database,
  LogOut,
  Bell,
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
  /** Qtd. de pedidos que o robô não reconheceu (áudio / falar com atendente). */
  atendimentosPendentes?: number;
  onOpenAtendimentos?: () => void;
}

/**
 * Abas do menu.
 * `label` é o nome completo (usado em title/aria-label, pois em telas
 * estreitas o texto é substituído pelo ícone).
 * `shortLabel` é o rótulo compacto exibido a partir de 1120px.
 * Nenhuma aba usa scroll horizontal: o menu encolhe por breakpoint.
 */
const TABS: {
  id: NavTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "kanban",
    label: "Painel de Pedidos",
    shortLabel: "Pedidos",
    icon: LayoutGrid,
  },
  {
    id: "tabela",
    label: "Tabela & Histórico",
    shortLabel: "Histórico",
    icon: TableIcon,
  },
  {
    id: "entregadores",
    label: "Entregadores",
    shortLabel: "Entregadores",
    icon: Bike,
  },
  {
    id: "caixa",
    label: "Fechamento Caixa",
    shortLabel: "Caixa",
    icon: Wallet,
  },
  {
    id: "metricas",
    label: "Métricas",
    shortLabel: "Métricas",
    icon: BarChart3,
  },
  {
    id: "configuracoes",
    label: "Configurações",
    shortLabel: "Ajustes",
    icon: Settings,
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  pedidosCountAguardando,
  pedidosCountProntos,
  isFetching,
  onRefresh,
  onOpenSettings,
  onLogout,
  atendimentosPendentes = 0,
  onOpenAtendimentos,
}) => {
  const isMock = isMockEnabled();
  const totalAtencao = pedidosCountAguardando + pedidosCountProntos;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 gap-1.5 sm:gap-3">
          {/* Marca — some só em telas muito estreitas (~360px) para o menu caber */}
          <div className="hidden min-[380px]:flex items-center gap-2.5 shrink-0">
            <img
              src="/logo-icon.png"
              alt="Binho do Gás"
              className="h-7 w-auto shrink-0"
            />
            <div className="leading-none shrink-0 hidden sm:block">
              <h1 className="font-semibold text-[14px] leading-none text-slate-900 tracking-tight m-0 whitespace-nowrap">
                Binho do Gás
              </h1>
              <span className="hidden lg:block text-[11px] leading-none text-slate-500 whitespace-nowrap mt-1">
                Painel de Gestão
              </span>
            </div>
          </div>

          {/* Abas — sem scroll horizontal: rótulo compacto a partir de 1120px
              e apenas ícone (com title/tooltip) abaixo disso. */}
          <nav
            aria-label="Navegação principal"
            className="flex items-stretch justify-center gap-0.5 min-w-0 h-14 flex-1"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              const showBadge = tab.id === "kanban" && totalAtencao > 0;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                  title={tab.label}
                  className={`tab justify-center px-1.5 sm:px-2 ${
                    isActive ? "tab-active" : ""
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden min-[1120px]:inline">
                    {tab.shortLabel}
                  </span>
                  {showBadge && (
                    <span className="tnum ml-0.5 h-5 min-w-5 px-1.5 inline-flex items-center justify-center rounded-sm bg-slate-200 text-[11px] font-semibold text-slate-700">
                      {totalAtencao}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Ações à direita — sempre visíveis */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Indicador de Modo Atual (apenas visualização) */}
            <div
              title={isMock ? "Modo Simulação" : "Conectado"}
              className={`flex items-center gap-1.5 h-8 px-1.5 sm:px-2.5 rounded-sm border text-xs font-medium cursor-default select-none ${
                isMock
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {isMock ? (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="hidden md:inline">Modo Simulação</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="hidden md:inline">Conectado</span>
                </>
              )}
            </div>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              className={`btn btn-icon ${isFetching ? "text-slate-900" : ""}`}
              title="Atualizar pedidos"
              aria-label="Atualizar pedidos"
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
              aria-label="Configurações da API"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Atendimentos pendentes (sino discreto) — antes do Sair */}
            {atendimentosPendentes > 0 && (
              <button
                onClick={onOpenAtendimentos}
                className="btn btn-icon relative"
                title="Pedidos não reconhecidos aguardando atendimento"
                aria-label={`${atendimentosPendentes} pedidos aguardando atendimento`}
              >
                <Bell className="w-4 h-4 text-danger" />
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center tnum">
                  {atendimentosPendentes > 9 ? "9+" : atendimentosPendentes}
                </span>
              </button>
            )}

            {/* Sair */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="btn btn-icon w-auto px-1.5 sm:px-2.5 gap-1.5"
                title="Sair do painel"
                aria-label="Sair do painel"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-[13px]">Sair</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
