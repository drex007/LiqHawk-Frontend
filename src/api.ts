import type {
  ByRiskParams,
  ByRiskResponse,
  RecentParams,
  RecentPositionsResponse,
} from "./types";

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

export async function fetchRecentPositions(
  params: RecentParams,
): Promise<RecentPositionsResponse> {
  const qs = new URLSearchParams({ limit: String(params.limit) });
  if (params.owner) qs.set("owner", params.owner);
  const res = await fetch(`${API_BASE}/positions/recent?${qs.toString()}`);
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
