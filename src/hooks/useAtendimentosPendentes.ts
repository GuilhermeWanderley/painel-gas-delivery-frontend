import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "../services/api";
import type { Transbordo } from "../types";
import { tocarBipe } from "../utils/beep";

/**
 * Fonte única dos atendimentos pendentes (transbordo do robô).
 *
 * - Polling a cada 10s, inclusive em segundo plano: o atendente costuma
 *   deixar o painel em outra aba.
 * - O bipe toca apenas na transição 0 → >0, nunca a cada ciclo de polling.
 */
export function useAtendimentosPendentes(): {
  pendentes: Transbordo[];
  total: number;
} {
  const { data: pendentes = [] } = useQuery({
    queryKey: ["atendimentos-pendentes"],
    queryFn: () => apiService.getAtendimentosPendentes(),
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const total = pendentes.length;

  const totalAnterior = useRef(0);
  useEffect(() => {
    if (totalAnterior.current === 0 && total > 0) void tocarBipe();
    totalAnterior.current = total;
  }, [total]);

  return { pendentes, total };
}
