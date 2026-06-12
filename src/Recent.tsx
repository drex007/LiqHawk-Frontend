import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { fetchRecentPositions } from "./api";
import type { RecentPositionRow, RecentPositionsResponse } from "./types";
import {
  formatHf,
  formatTime,
  formatUsd,
  secondsAgo,
  shortAddress,
  shortId,
} from "./format";
import { RISK_STYLES } from "./risk";
import { RowTooltip } from "./RowTooltip";
import { CopyButton } from "./CopyButton";

const REFRESH_MS = 30_000;
const LIMIT_OPTIONS = [25, 50, 100, 200];
const DEFAULT_LIMIT = 100;

export default function Recent() {
  const [data, setData] = useState<RecentPositionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [ownerInput, setOwnerInput] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [now, setNow] = useState(Date.now());
  const inFlight = useRef(false);

  const load = useCallback(async (lim: number, owner?: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const next = await fetchRecentPositions({ limit: lim, owner });
      setData(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setOwnerFilter(ownerInput.trim()), 400);
    return () => clearTimeout(t);
  }, [ownerInput]);

  useEffect(() => {
    setLoading(true);
    load(limit, ownerFilter || undefined);
  }, [limit, ownerFilter, load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(
      () => load(limit, ownerFilter || undefined),
      REFRESH_MS,
    );
    return () => clearInterval(t);
  }, [autoRefresh, limit, ownerFilter, load]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const positions = data?.positions ?? [];
  const newest = positions[0];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Recent positions
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Latest position snapshots across all blocks — newest first. Updates
          every {REFRESH_MS / 1000}s while auto-refresh is on.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <span className="font-semibold">API error:</span> {error}
        </div>
      )}

      <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Show
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700/70 dark:bg-slate-900/60">
              {LIMIT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setLimit(n)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition ${
                    limit === n
                      ? "bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={ownerInput}
              onChange={(e) => setOwnerInput(e.target.value)}
              placeholder="Filter by owner (0x…)"
              spellCheck={false}
              autoComplete="off"
              className="mono w-72 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/50 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700/60"
            />
            {ownerInput && (
              <button
                type="button"
                onClick={() => setOwnerInput("")}
                title="Clear owner filter"
                aria-label="Clear owner filter"
                className="absolute right-1.5 rounded p-0.5 text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            {data ? `${data.count.toLocaleString()} snapshots` : "—"}
            {ownerFilter && (
              <span className="ml-1">
                for{" "}
                <span className="mono text-slate-700 dark:text-slate-300">
                  {ownerFilter.length > 14
                    ? `${ownerFilter.slice(0, 6)}…${ownerFilter.slice(-4)}`
                    : ownerFilter}
                </span>
              </span>
            )}
          </span>
        </div>

        <div
          className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400"
          data-now={now}
        >
          {newest && (
            <span title={formatTime(newest.captured_at)}>
              Newest{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {secondsAgo(newest.captured_at)}s ago
              </span>
              <span className="mono ml-2">
                · #{newest.block_number.toLocaleString()}
              </span>
            </span>
          )}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 transition ${
              autoRefresh
                ? "bg-emerald-100 text-emerald-700 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/40"
                : "bg-slate-100 text-slate-600 ring-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700"
            }`}
            title="Toggle auto-refresh"
          >
            <span
              className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{ background: autoRefresh ? "#34d399" : "#94a3b8" }}
            />
            Auto
          </button>
          <button
            onClick={() => load(limit)}
            disabled={loading}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </section>

      <RecentTable rows={positions} loading={loading && !data} now={now} />
    </main>
  );
}

function RecentTable({
  rows,
  loading,
  now,
}: {
  rows: RecentPositionRow[];
  loading: boolean;
  now: number;
}) {
  const [tooltip, setTooltip] = useState<{
    row: RecentPositionRow;
    x: number;
    y: number;
  } | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-400">
        <span className="pulse-soft">Loading recent positions…</span>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-400">
        No recent positions found.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800/70 dark:bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-now={now}>
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
              <tr>
                <th className="w-1 px-2 py-3" />
                <th className="px-3 py-3">Captured</th>
                <th className="px-3 py-3">Block</th>
                <th className="px-3 py-3">Risk</th>
                <th className="px-3 py-3">Position</th>
                <th className="px-3 py-3">Protocol</th>
                <th className="px-3 py-3">Owner</th>
                <th className="px-3 py-3">Collateral</th>
                <th className="px-3 py-3 text-right">HF</th>
                <th className="px-3 py-3 text-right">Collateral $</th>
                <th className="px-3 py-3 text-right">Debt $</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {rows.map((p, i) => (
                <RecentRow
                  key={`${p.position_id}-${p.block_number}-${i}`}
                  p={p}
                  onEnter={(e) =>
                    setTooltip({ row: p, x: e.clientX, y: e.clientY })
                  }
                  onMove={(e) =>
                    setTooltip((t) =>
                      t && t.row === p
                        ? { ...t, x: e.clientX, y: e.clientY }
                        : t,
                    )
                  }
                  onLeave={() => setTooltip(null)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {tooltip && <RowTooltip row={tooltip.row} x={tooltip.x} y={tooltip.y} />}
    </>
  );
}

function RecentRow({
  p,
  onEnter,
  onMove,
  onLeave,
}: {
  p: RecentPositionRow;
  onEnter: (e: ReactMouseEvent) => void;
  onMove: (e: ReactMouseEvent) => void;
  onLeave: () => void;
}) {
  const s = RISK_STYLES[p.risk_level];
  return (
    <tr
      className={`transition ${s.chipBg}`}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <td
        className={`relative w-1 p-0 before:absolute before:inset-y-0 before:left-0 before:w-1 ${s.bar}`}
      />
      <td
        className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300"
        title={formatTime(p.captured_at)}
      >
        {secondsAgo(p.captured_at)}s ago
      </td>
      <td className="px-3 py-2.5 mono text-xs text-slate-600 dark:text-slate-300">
        #{p.block_number.toLocaleString()}
      </td>
      <td className="px-3 py-2.5">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${s.pill}`}
        >
          {p.risk_level}
        </span>
      </td>
      <td
        className="px-3 py-2.5 mono text-xs text-slate-700 dark:text-slate-300"
        title={p.position_id}
      >
        {shortId(p.position_id)}
      </td>
      <td className="px-3 py-2.5">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
          {p.protocol}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="mono" title={p.owner}>
            {shortAddress(p.owner)}
          </span>
          <CopyButton value={p.owner} />
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200">
        {p.dominant_collateral ?? (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        )}
      </td>
      <td className={`px-3 py-2.5 text-right mono tabular-nums ${s.text}`}>
        {formatHf(p.health_factor)}
      </td>
      <td className="px-3 py-2.5 text-right mono tabular-nums text-slate-800 dark:text-slate-200">
        {formatUsd(p.total_collateral_usd)}
      </td>
      <td className="px-3 py-2.5 text-right mono tabular-nums text-slate-800 dark:text-slate-200">
        {formatUsd(p.total_debt_usd)}
      </td>
    </tr>
  );
}
