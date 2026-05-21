export function shortAddress(addr: string, head = 6, tail = 4): string {
  if (!addr) return "—";
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function shortId(id: string): string {
  if (!id) return "—";
  if (id.length <= 10) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

export function formatUsd(raw: string | number): string {
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (!isFinite(n)) return "—";
  if (n >= 1_000_000)
    return `$${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  if (n >= 1_000)
    return `$${(n / 1_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatHf(raw: string | number): string {
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (!isFinite(n)) return "—";
  return n.toFixed(4);
}

export function formatPct(raw: string | number): string {
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (!isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function secondsAgo(iso: string): number {
  try {
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  } catch {
    return 0;
  }
}
