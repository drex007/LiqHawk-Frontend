import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Pricing from "./Pricing";
import Recent from "./Recent";
import { RISK_ORDER, RISK_STYLES } from "./risk";
import { RowTooltip } from "./RowTooltip";
import { CopyButton } from "./CopyButton";
import { fetchByRisk } from "./api";
import type {
  ByRiskResponse,
  PositionRow,
  ProtocolFilter,
  RiskFilter,
  RiskLevel,
} from "./types";
import {
  formatHf,
  formatPct,
  formatTime,
  formatUsd,
  secondsAgo,
  shortAddress,
  shortId,
} from "./format";

const REFRESH_MS = 30_000;
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
const DEFAULT_PAGE_SIZE = 50;

const PROTOCOL_LABEL: Record<ProtocolFilter, string> = {
  all: "All protocols",
  init: "INIT Capital",
  lendle: "Lendle",
};

type Route = "dashboard" | "pricing" | "recent";

function parseHash(): Route {
  if (typeof window === "undefined") return "dashboard";
  const h = window.location.hash.replace(/^#/, "");
  if (h === "/pricing" || h === "/api") return "pricing";
  if (h === "/recent" || h === "/positions/recent") return "recent";
  return "dashboard";
}

function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = useCallback((r: Route) => {
    window.location.hash =
      r === "pricing" ? "/pricing" : r === "recent" ? "/recent" : "/";
  }, []);
  return [route, navigate];
}

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);
  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );
  return [theme, toggle];
}

export default function App() {
  const [data, setData] = useState<ByRiskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<ProtocolFilter>("all");
  const [risk, setRisk] = useState<RiskFilter>("any");
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState<number>(0); // zero-indexed
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [theme, toggleTheme] = useTheme();
  const [route, navigate] = useHashRoute();
  const inFlight = useRef(false);

  const load = useCallback(
    async (proto: ProtocolFilter, r: RiskFilter, lim: number, pg: number) => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const next = await fetchByRisk({
          protocol: proto,
          risk: r,
          limit: lim,
          skip: pg * lim,
        });
        setData(next);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
        inFlight.current = false;
      }
    },
    [],
  );

  // Reset to page 0 when filters or page size change.
  useEffect(() => {
    setPage(0);
  }, [protocol, risk, pageSize]);

  useEffect(() => {
    setLoading(true);
    load(protocol, risk, pageSize, page);
  }, [protocol, risk, pageSize, page, load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(
      () => load(protocol, risk, pageSize, page),
      REFRESH_MS,
    );
    return () => clearInterval(t);
  }, [autoRefresh, protocol, risk, pageSize, page, load]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stats = data?.totals ?? { CRITICAL: 0, HIGH: 0, MEDIUM: 0, SAFE: 0 };
  const totalPositions =
    stats.CRITICAL + stats.HIGH + stats.MEDIUM + stats.SAFE;
  const capturedAgo = data ? secondsAgo(data.captured_at) : 0;
  const rows = data?.positions ?? [];
  const total = data?.total ?? 0;
  const pageStart = data ? data.skip + 1 : 0;
  const pageEnd = data ? data.skip + rows.length : 0;
  const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);
  const hasPrev = page > 0;
  const hasMore = data?.has_more ?? false;

  return (
    <div className="min-h-full">
      <Header
        block={data?.block_number}
        capturedAt={data?.captured_at}
        capturedAgo={capturedAgo}
        loading={loading}
        autoRefresh={autoRefresh}
        onToggleAuto={() => setAutoRefresh((v) => !v)}
        onRefresh={() => load(protocol, risk, pageSize, page)}
        now={now}
        theme={theme}
        onToggleTheme={toggleTheme}
        route={route}
        onNavigate={navigate}
      />

      {route === "pricing" ? (
        <Pricing />
      ) : route === "recent" ? (
        <Recent />
      ) : (
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            <span className="font-semibold">API error:</span> {error}
          </div>
        )}

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RISK_ORDER.map((r) => (
            <StatCard
              key={r}
              risk={r}
              count={stats[r] ?? 0}
              total={totalPositions}
              onClick={() => setRisk((cur) => (cur === r ? "any" : r))}
              active={risk === r}
            />
          ))}
        </section>

        <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Protocol
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700/70 dark:bg-slate-900/60">
                {(["all", "init", "lendle"] as ProtocolFilter[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProtocol(p)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      protocol === p
                        ? "bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {PROTOCOL_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Per page
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700/70 dark:bg-slate-900/60">
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPageSize(n)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition ${
                      pageSize === n
                        ? "bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {risk !== "any" && (
              <button
                onClick={() => setRisk("any")}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Clear {risk} filter ✕
              </button>
            )}
            <span>
              {total > 0 ? (
                <>
                  Showing{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {pageStart.toLocaleString()}–{pageEnd.toLocaleString()}
                  </span>{" "}
                  of {total.toLocaleString()}
                </>
              ) : (
                <>0 results</>
              )}
            </span>
          </div>
        </section>

        <PositionsTable rows={rows} loading={loading && !data} />

        <Pagination
          page={page}
          pageCount={pageCount}
          hasPrev={hasPrev}
          hasMore={hasMore}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
          onFirst={() => setPage(0)}
          onLast={() => setPage(Math.max(0, pageCount - 1))}
          disabled={loading}
        />
      </main>
      )}

      <footer className="border-t border-slate-200 py-5 text-xs text-slate-500 dark:border-slate-800/70 dark:text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between sm:gap-4 sm:px-6 lg:px-8">
          <span>LiqHawk — Mantle · refresh {REFRESH_MS / 1000}s</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Live alerts
            </span>
            <a
              href="https://t.me/liqhawk_alerts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 transition hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-300"
              title="Join the Telegram alerts channel"
            >
              <TelegramIcon className="h-3.5 w-3.5" />
              Telegram
            </a>
            <a
              href="https://discord.gg/Xva5Df6AJ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
              title="Join the Discord alerts server"
            >
              <DiscordIcon className="h-3.5 w-3.5" />
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Header({
  block,
  capturedAt,
  capturedAgo,
  loading,
  autoRefresh,
  onToggleAuto,
  onRefresh,
  now,
  theme,
  onToggleTheme,
  route,
  onNavigate,
}: {
  block?: number;
  capturedAt?: string;
  capturedAgo: number;
  loading: boolean;
  autoRefresh: boolean;
  onToggleAuto: () => void;
  onRefresh: () => void;
  now: number;
  theme: Theme;
  onToggleTheme: () => void;
  route: Route;
  onNavigate: (r: Route) => void;
}) {
  const isDashboard = route === "dashboard";
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500/40 to-orange-500/40 ring-1 ring-rose-400/30">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-rose-600 dark:text-rose-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M17 7h4v4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">
                LiqHawk
              </h1>
              <p className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:block">
                Position risk monitor · Mantle
              </p>
            </div>
          </button>

          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            <NavLink
              active={isDashboard}
              onClick={() => onNavigate("dashboard")}
            >
              Dashboard
            </NavLink>
            <NavLink
              active={route === "recent"}
              onClick={() => onNavigate("recent")}
            >
              Recent
            </NavLink>
            <NavLink
              active={route === "pricing"}
              onClick={() => onNavigate("pricing")}
            >
              API
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isDashboard && (
            <>
              <div className="hidden flex-col items-end text-right sm:flex">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">
                  Block
                </span>
                <span className="mono text-sm text-slate-800 dark:text-slate-200">
                  {block ? `#${block.toLocaleString()}` : "—"}
                </span>
              </div>
              <div className="hidden flex-col items-end text-right md:flex">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">
                  Captured
                </span>
                <span
                  className="text-xs text-slate-600 dark:text-slate-300"
                  title={capturedAt ? formatTime(capturedAt) : ""}
                  data-now={now}
                >
                  {capturedAt ? `${capturedAgo}s ago` : "—"}
                </span>
              </div>
            </>
          )}

          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {isDashboard && (
            <>
              <button
                onClick={onToggleAuto}
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
                onClick={onRefresh}
                disabled={loading}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                {loading ? "Loading…" : "Refresh"}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0188 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

function NavLink({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function StatCard({
  risk,
  count,
  total,
  active,
  onClick,
}: {
  risk: RiskLevel;
  count: number;
  total: number;
  active: boolean;
  onClick: () => void;
}) {
  const s = RISK_STYLES[risk];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border bg-white px-4 py-3 text-left transition dark:bg-slate-900/40 ${
        active
          ? "border-slate-400 ring-2 ring-slate-300/60 dark:border-slate-500 dark:ring-slate-400/30"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-800/80 dark:hover:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {risk}
          </span>
        </div>
        <span className="text-[11px] text-slate-500">{pct}%</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${s.text}`}>
        {count.toLocaleString()}
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-full ${s.dot}`} style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}

function PositionsTable({
  rows,
  loading,
}: {
  rows: PositionRow[];
  loading: boolean;
}) {
  const [tooltip, setTooltip] = useState<{
    row: PositionRow;
    x: number;
    y: number;
  } | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-400">
        <span className="pulse-soft">Loading positions…</span>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-400">
        No positions to show. Try a different filter — or wait for the first
        snapshot to land.
      </div>
    );
  }
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800/70 dark:bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
              <tr>
                <th className="w-1 px-2 py-3" />
                <th className="px-3 py-3">Risk</th>
                <th className="px-3 py-3">Position</th>
                <th className="px-3 py-3">Protocol</th>
                <th className="px-3 py-3">Owner</th>
                <th className="px-3 py-3">Collateral</th>
                <th className="px-3 py-3 text-right">HF</th>
                <th className="px-3 py-3 text-right">Δ to liq.</th>
                <th className="px-3 py-3 text-right">Collateral $</th>
                <th className="px-3 py-3 text-right">Debt $</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {rows.map((p, i) => (
                <PositionRowView
                  key={`${p.position_id}-${p.protocol}-${i}`}
                  p={p}
                  onEnter={(e) =>
                    setTooltip({ row: p, x: e.clientX, y: e.clientY })
                  }
                  onMove={(e) =>
                    setTooltip((t) =>
                      t && t.row === p ? { ...t, x: e.clientX, y: e.clientY } : t,
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

function PositionRowView({
  p,
  onEnter,
  onMove,
  onLeave,
}: {
  p: PositionRow;
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
      <td className="px-3 py-2.5">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${s.pill}`}
        >
          {p.risk_level}
        </span>
      </td>
      <td className="px-3 py-2.5 mono text-xs text-slate-700 dark:text-slate-300" title={p.position_id}>
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
        {p.dominant_collateral ?? <span className="text-slate-400 dark:text-slate-500">—</span>}
      </td>
      <td className={`px-3 py-2.5 text-right mono tabular-nums ${s.text}`}>
        {formatHf(p.health_factor)}
      </td>
      <td className="px-3 py-2.5 text-right mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
        {formatPct(p.distance_to_liquidation_pct)}
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

function Pagination({
  page,
  pageCount,
  hasPrev,
  hasMore,
  onPrev,
  onNext,
  onFirst,
  onLast,
  disabled,
}: {
  page: number;
  pageCount: number;
  hasPrev: boolean;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFirst: () => void;
  onLast: () => void;
  disabled: boolean;
}) {
  if (pageCount <= 1) return null;
  const btn =
    "rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800";
  return (
    <nav
      className="mt-4 flex items-center justify-between gap-2"
      aria-label="Pagination"
    >
      <div className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
        Page <span className="font-semibold text-slate-800 dark:text-slate-200">{page + 1}</span> of{" "}
        {pageCount.toLocaleString()}
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={onFirst} disabled={!hasPrev || disabled} className={btn}>
          « First
        </button>
        <button onClick={onPrev} disabled={!hasPrev || disabled} className={btn}>
          ‹ Prev
        </button>
        <button onClick={onNext} disabled={!hasMore || disabled} className={btn}>
          Next ›
        </button>
        <button onClick={onLast} disabled={!hasMore || disabled} className={btn}>
          Last »
        </button>
      </div>
    </nav>
  );
}
