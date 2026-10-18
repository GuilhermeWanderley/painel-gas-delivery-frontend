/**
 * Autenticação do painel (HTTP Basic).
 *
 * As credenciais ficam no localStorage e são enviadas em todas as chamadas
 * pela interceptação do axios. Quando o backend responde 401, disparamos um
 * evento para o App voltar à tela de login.
 */

const STORAGE_KEY_AUTH = "gas_auth_basic";

export const EVENTO_NAO_AUTORIZADO = "gas:nao-autorizado";

export interface Credenciais {
  usuario: string;
  senha: string;
}

/** Base64 seguro para UTF-8 (evita erro com acentos na senha). */
function paraBase64(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  bytes.forEach((b) => {
    binario += String.fromCharCode(b);
  });
  return btoa(binario);
}

export function getCredenciais(): Credenciais | null {
  const bruto = localStorage.getItem(STORAGE_KEY_AUTH);
  if (!bruto) return null;
  try {
    const dados = JSON.parse(bruto) as Credenciais;
    if (dados?.usuario && dados?.senha) return dados;
  } catch {
    /* dado corrompido: ignora */
  }
  return null;
}

export function salvarCredenciais(credenciais: Credenciais): void {
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(credenciais));
}

export function limparCredenciais(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

export function estaAutenticado(): boolean {
  return getCredenciais() !== null;
}

/** Header `Authorization: Basic ...` pronto, ou null se não houver login. */
export function cabecalhoAutorizacao(): string | null {
  const credenciais = getCredenciais();
  if (!credenciais) return null;
  return `Basic ${paraBase64(`${credenciais.usuario}:${credenciais.senha}`)}`;
}

/** Basic explícito (usado para validar o login antes de salvar). */
export function basicPara(usuario: string, senha: string): string {
  return `Basic ${paraBase64(`${usuario}:${senha}`)}`;
}

export function notificarNaoAutorizado(): void {
  window.dispatchEvent(new Event(EVENTO_NAO_AUTORIZADO));
}

/** Encerra a sessão e devolve o usuário para a tela de login. */
export function sair(): void {
  limparCredenciais();
  notificarNaoAutorizado();
}
