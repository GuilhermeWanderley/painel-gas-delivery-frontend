import React, { useEffect, useState } from "react";
import { apiService, getErrorMessage } from "../../services/api";
import type { Configuracao } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { useToast } from "../common/ToastContext";
import {
  Settings2,
  Save,
  Flame,
  Percent,
  CalendarDays,
  CreditCard,
  Banknote,
} from "lucide-react";

export const ConfiguracoesView: React.FC = () => {
  const toast = useToast();
  const [cfg, setCfg] = useState<Configuracao | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregar = async () => {
    try {
      setCfg(await apiService.getConfiguracao());
    } catch (e) {
      toast.error(getErrorMessage(e), "Erro ao Carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salvar = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      const salvo = await apiService.atualizarConfiguracao(cfg);
      setCfg(salvo);
      toast.success("Preços atualizados com sucesso!", "Configuração Salva");
    } catch (e) {
      toast.error(getErrorMessage(e), "Erro ao Salvar");
    } finally {
      setSaving(false);
    }
  };

  const setNum =
    (field: keyof Configuracao) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!cfg) return;
      const raw = e.target.value.replace(",", ".");
      const value = raw === "" ? 0 : Number(raw);
      setCfg({ ...cfg, [field]: Number.isFinite(value) ? value : 0 });
    };

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-500">
        Carregando configurações...
      </div>
    );
  }
  if (!cfg) return null;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Configuração de Preços
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Altere os valores e clique em salvar — os novos preços passam a
              valer na hora para novos pedidos.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de preços */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          <CampoPreco
            icon={<Banknote className="w-5 h-5 text-blue-600" />}
            label="Gás comum (P13) — à vista"
            desc="Dinheiro, PIX ou débito"
            value={cfg.precoGasVista}
            onChange={setNum("precoGasVista")}
          />
          <CampoPreco
            icon={<CreditCard className="w-5 h-5 text-blue-600" />}
            label="Gás comum (P13) — cartão de crédito"
            desc="Parcelável em até 2x"
            value={cfg.precoGasCredito}
            onChange={setNum("precoGasCredito")}
          />
          <CampoPreco
            icon={<Flame className="w-5 h-5 text-blue-600" />}
            label="Gás do Povo (benefício)"
            desc="Valor fixo do programa do governo"
            value={cfg.precoGasPovo}
            onChange={setNum("precoGasPovo")}
          />
          <CampoPreco
            icon={<Percent className="w-5 h-5 text-blue-600" />}
            label="Desconto de quarta-feira"
            desc="Em reais, subtraído do gás comum toda quarta"
            value={cfg.descontoQuarta}
            onChange={setNum("descontoQuarta")}
          />
        </div>

        {/* Toggle da promoção */}
        <div className="p-6 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Promoção de quarta-feira
              </div>
              <div className="text-xs text-slate-500">
                Quando ativa, o gás comum fica{" "}
                {formatCurrency(cfg.descontoQuarta)} mais barato toda quarta.
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              setCfg({ ...cfg, promocaoQuartaAtiva: !cfg.promocaoQuartaAtiva })
            }
            className={`relative w-14 h-8 rounded-full transition-colors ${
              cfg.promocaoQuartaAtiva ? "bg-blue-600" : "bg-slate-300"
            }`}
            aria-pressed={cfg.promocaoQuartaAtiva}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-md bg-white shadow transition-all ${
                cfg.promocaoQuartaAtiva ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Ação */}
      <div className="flex justify-end">
        <button
          onClick={salvar}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md shadow-blue-600/20 hover:shadow-md transition disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Preços"}
        </button>
      </div>
    </div>
  );
};

// Ícones são vetoriais (lucide), mantendo o painel sem emojis.

interface CampoPrecoProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function CampoPreco({ icon, label, desc, value, onChange }: CampoPrecoProps) {
  return (
    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <div className="font-bold text-slate-900 text-sm">{label}</div>
          <div className="text-xs text-slate-500">{desc}</div>
        </div>
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
          R$
        </span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={onChange}
          className="w-40 pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}
