import React, { useState } from "react";
import { LogIn, Lock, User, AlertCircle } from "lucide-react";
import { validarCredenciais } from "../../services/api";
import { salvarCredenciais } from "../../services/auth";

interface LoginViewProps {
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const entrar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await validarCredenciais(usuario.trim(), senha);
      salvarCredenciais({ usuario: usuario.trim(), senha });
      onSuccess();
    } catch {
      setErro("Usuário ou senha inválidos.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form
        onSubmit={entrar}
        className="card w-full max-w-sm p-6"
        autoComplete="on"
      >
        {/* Marca */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo-full.png"
            alt="Binho do Gás"
            className="h-20 w-auto"
          />
        </div>

        <h2 className="page-title mb-1">Acessar o painel</h2>
        <p className="page-subtitle mb-5">
          Informe suas credenciais para continuar.
        </p>

        <div className="space-y-3">
          <div>
            <label htmlFor="usuario" className="label block mb-1.5">
              Usuário
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="usuario"
                name="usuario"
                className="input w-full pl-9"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="senha" className="label block mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="senha"
                name="senha"
                type="password"
                className="input w-full pl-9"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>
        </div>

        {erro && (
          <div className="mt-4 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-sm px-3 py-2 text-[13px]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="btn btn-primary w-full mt-5"
        >
          <LogIn className="w-4 h-4" />
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};
