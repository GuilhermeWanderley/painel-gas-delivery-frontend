/**
 * Bipe curto via Web Audio API (sem arquivo de áudio).
 *
 * Navegadores só liberam áudio depois de um gesto do usuário. Como o bipe é
 * disparado pelo polling (sem gesto), mantemos um AudioContext compartilhado
 * que é criado/retomado no primeiro clique ou tecla da sessão.
 */

let ctx: AudioContext | null = null;

function obterContexto(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function desbloquear(): void {
  const c = obterContexto();
  if (c && c.state === "suspended") void c.resume();
  window.removeEventListener("pointerdown", desbloquear);
  window.removeEventListener("keydown", desbloquear);
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", desbloquear);
  window.addEventListener("keydown", desbloquear);
}

export async function tocarBipe(): Promise<void> {
  const c = obterContexto();
  if (!c) return;
  try {
    if (c.state === "suspended") await c.resume();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.4);
  } catch {
    /* áudio bloqueado pelo navegador: o alerta visual continua valendo */
  }
}
