export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "SAFE";
export type RiskFilter = "any" | RiskLevel;
export type ProtocolId = "init" | "lendle";
export type ProtocolFilter = "all" | ProtocolId;

export interface PositionRow {
  position_id: string;
  protocol: ProtocolId;
  owner: string;
  health_factor: string;
  risk_level: RiskLevel;
  dominant_collateral: string | null;
  total_collateral_usd: string;
  total_debt_usd: string;
  distance_to_liquidation_pct: string;
}

export interface ByRiskResponse {
  block_number: number;
  captured_at: string;
  protocol_filter: ProtocolFilter;
  risk_filter: RiskFilter;
  totals: Record<RiskLevel, number>;
  total: number;
  limit: number;
  skip: number;
  has_more: boolean;
  positions: PositionRow[];
}

export interface ByRiskParams {
  protocol: ProtocolFilter;
  risk: RiskFilter;
  limit: number;
  skip: number;
}

export interface RecentPositionRow {
  block_number: number;
  captured_at: string;
  position_id: string;
  protocol: ProtocolId;
  owner: string;
  health_factor: string;
  risk_level: RiskLevel;
  dominant_collateral: string | null;
  total_collateral_usd: string;
  total_debt_usd: string;
}

export interface RecentPositionsResponse {
  limit: number;
  count: number;
  positions: RecentPositionRow[];
}

export interface RecentParams {
  limit: number;
  owner?: string;
}
