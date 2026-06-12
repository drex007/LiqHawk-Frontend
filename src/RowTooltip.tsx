import { shortId } from "./format";
import type { ProtocolId, RiskLevel } from "./types";

export type TooltipRow = {
  owner: string;
  protocol: ProtocolId;
  risk_level: RiskLevel;
  position_id: string;
};

export function RowTooltip({
  row,
  x,
  y,
}: {
  row: TooltipRow;
  x: number;
  y: number;
}) {
  const OFFSET = 14;
  const W = 320;
  const left =
    typeof window !== "undefined" && x + OFFSET + W > window.innerWidth
      ? x - OFFSET - W
      : x + OFFSET;
  const top = y + OFFSET;
  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
      style={{ left, top, width: W }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Wallet
      </div>
      <div className="mono mt-0.5 break-all text-slate-900 dark:text-slate-100">
        {row.owner}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <span>
          <span className="uppercase tracking-wider">{row.protocol}</span> ·{" "}
          {row.risk_level}
        </span>
        <span className="mono" title={row.position_id}>
          {shortId(row.position_id)}
        </span>
      </div>
    </div>
  );
}
