import type { ByRiskParams, ByRiskResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function fetchByRisk(params: ByRiskParams): Promise<ByRiskResponse> {
  const qs = new URLSearchParams({
    protocol: params.protocol,
    risk: params.risk,
    limit: String(params.limit),
    skip: String(params.skip),
  });
  const res = await fetch(`${API_BASE}/positions/by-risk?${qs.toString()}`);
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
