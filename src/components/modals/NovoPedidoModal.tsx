import React, { useState } from "react";
import axios from "axios";
import type { OrderType, PaymentMethod } from "../../types";
import {
  getErrorMessage,
  type NovoPedidoPayload,
} from "../../services/api";
import { useToast } from "../common/ToastContext";
import { useLockBodyScroll } from "../../utils/useLockBodyScroll";
import {
  ClipboardList,
  X,
  User,
  Phone,
  MapPin,
  Flame,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface NovoPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: NovoPedidoPayload) => Promise<void>;
}

const FORMAS_PAGAMENTO: { value: PaymentMethod; label: string }[] = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de Débito" },
];

export const NovoPedidoModal: React.FC<NovoPedidoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  useLockBodyScroll(isOpen);

  const toast = useToast();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [tipoPedido, setTipoPedido] = useState<OrderType>("NORMAL");
  const [endereco, setEndereco] = useState("");
  const [formaPagamento, setFormaPagamento] =
    useState<PaymentMethod>("DINHEIRO");
  const [troco, setTroco] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const isGasDoPovo = tipoPedido === "GAS_DO_POVO";

  const resetForm = () => {
    setNome("");
    setTelefone("");
    setCpf("");
    setTipoPedido("NORMAL");
    setEndereco("");
    setFormaPagamento("DINHEIRO");
    setTroco("");
    setErrorMsg("");
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) {
      setTelefone(digits ? `(${digits}` : "");
    } else if (digits.length <= 7) {
      setTelefone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else {
      setTelefone(
        `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`,
      );
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 9) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    } else if (digits.length > 6) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }
    setCpf(formatted);
  };

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoTipo = e.target.value as OrderType;
    setTipoPedido(novoTipo);
    if (novoTipo === "NORMAL") setCpf("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const nomeTrimmed = nome.trim();
    const telefoneDigits = telefone.replace(/\D/g, "");
    const cpfDigits = cpf.replace(/\D/g, "");
    const enderecoTrimmed = endereco.trim();

    if (!nomeTrimmed) {
      setErrorMsg("Informe o nome do cliente.");
      return;
    }
    if (telefoneDigits.length < 10) {
      setErrorMsg("Informe um telefone válido com DDD.");
      return;
    }
    if (isGasDoPovo && cpfDigits.length !== 11) {
      setErrorMsg("O CPF é obrigatório para pedidos do Gás do Povo.");
      return;
    }
    if (isGasDoPovo && /^(\d)\1{10}$/.test(cpfDigits)) {
      setErrorMsg("Informe um CPF válido.");
      return;
    }
    if (!enderecoTrimmed) {
      setErrorMsg("Informe o endereço de entrega.");
      return;
    }

    let precisaTrocoPara: number | undefined;
    if (formaPagamento === "DINHEIRO" && troco.trim()) {
      const valor = Number(troco.replace(",", "."));
      if (!Number.isFinite(valor) || valor <= 0) {
        setErrorMsg("Informe um valor de troco válido.");
        return;
      }
      precisaTrocoPara = valor;
    }

    const payload: NovoPedidoPayload = {
      nome: nomeTrimmed,
      telefone:
        telefoneDigits.length > 11
          ? telefoneDigits
          : `55${telefoneDigits}`,
      tipoPedido,
      enderecoEntrega: enderecoTrimmed,
      formaPagamento,
      ...(isGasDoPovo ? { cpf: cpfDigits } : {}),
      ...(precisaTrocoPara !== undefined ? { precisaTrocoPara } : {}),
    };

    try {
      setSubmitting(true);
      await onConfirm(payload);
      resetForm();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setErrorMsg("Abra o caixa antes de lançar um pedido.");
        toast.error(
          "Abra o caixa antes de lançar um pedido.",
          "Caixa fechado",
        );
      } else {
        const mensagem = getErrorMessage(err);
        setErrorMsg(mensagem);
        toast.error(mensagem, "Erro ao criar pedido");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">
                Novo Pedido
              </h3>
              <p className="text-[12px] text-slate-500">
                Lançamento manual para clientes por telefone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="btn btn-icon shrink-0"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-[12px] rounded-sm font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1.5">Nome *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Maria Francisca"
                  className="input w-full pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label block mb-1.5">Telefone *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={telefone}
                  onChange={handleTelefoneChange}
                  placeholder="(81) 98888-7777"
                  className="input w-full pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label block mb-1.5">
                Tipo de pedido *
              </label>
              <select
                value={tipoPedido}
                onChange={handleTipoChange}
                className="input w-full"
              >
                <option value="NORMAL">Normal</option>
                <option value="GAS_DO_POVO">Gás do Povo</option>
              </select>
            </div>

            <div>
              <label className="label block mb-1.5">
                CPF {isGasDoPovo ? "*" : "(Gás do Povo)"}
              </label>
              <input
                type="text"
                inputMode="numeric"
                required={isGasDoPovo}
                disabled={!isGasDoPovo}
                value={isGasDoPovo ? cpf : ""}
                onChange={handleCpfChange}
                placeholder={
                  isGasDoPovo ? "000.000.000-00" : "Só para Gás do Povo"
                }
                className="input w-full disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label block mb-1.5">
                Endereço de entrega *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro e cidade"
                  className="input w-full pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label block mb-1.5">
                Forma de pagamento *
              </label>
              <select
                value={formaPagamento}
                onChange={(e) =>
                  setFormaPagamento(e.target.value as PaymentMethod)
                }
                className="input w-full"
              >
                {FORMAS_PAGAMENTO.map((forma) => (
                  <option key={forma.value} value={forma.value}>
                    {forma.label}
                  </option>
                ))}
              </select>
            </div>

            {formaPagamento === "DINHEIRO" && (
              <div>
                <label className="label block mb-1.5">
                  Troco para (opcional)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={troco}
                  onChange={(e) => setTroco(e.target.value)}
                  placeholder="Ex: 100,00"
                  className="input w-full tnum"
                />
              </div>
            )}
          </div>

          {isGasDoPovo && (
            <div className="flex items-start gap-2 text-[12px] text-slate-600 bg-slate-50 border border-slate-200 rounded-sm px-3 py-2">
              <Flame className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <span>
                Pedidos do Gás do Povo entram na coluna de análise de CPF e
                ficam pendentes de aprovação do benefício.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar pedido</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
