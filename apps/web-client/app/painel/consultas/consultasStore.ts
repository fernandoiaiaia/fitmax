"use client";
import { useState, useEffect } from "react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type StatusConsulta =
  | "consulta_solicitada"
  | "pagamento_pendente"
  | "consulta_confirmada"
  | "consulta_recusada";

type StatusMap = Record<string, StatusConsulta>;

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORE_KEY  = "fitmax_consultas_status";
const EVENT_NAME = "fitmax_status_change";

// ─── Core (sem React) ─────────────────────────────────────────────────────────

export function getStatusMap(): StatusMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}"); }
  catch { return {}; }
}

export function getStatus(id: string): StatusConsulta | null {
  return getStatusMap()[id] ?? null;
}

export function updateStatus(id: string, status: StatusConsulta): void {
  if (typeof window === "undefined") return;
  const map = getStatusMap();
  map[id] = status;
  localStorage.setItem(STORE_KEY, JSON.stringify(map));
  // Notifica o mesmo tab via CustomEvent
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { id, status } }));
}

// ─── React Hook ───────────────────────────────────────────────────────────────

export function useStatusMap(): StatusMap {
  const [map, setMap] = useState<StatusMap>(() => getStatusMap());

  useEffect(() => {
    function refresh() { setMap({ ...getStatusMap() }); }
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage",   refresh); // outros tabs
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage",   refresh);
    };
  }, []);

  return map;
}
