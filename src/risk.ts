import type { RiskLevel } from "./types";

export const RISK_ORDER: RiskLevel[] = ["CRITICAL", "HIGH", "MEDIUM", "SAFE"];

export const RISK_STYLES: Record<
  RiskLevel,
  { pill: string; bar: string; chipBg: string; text: string; dot: string }
> = {
  CRITICAL: {
    pill: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/40",
    bar: "before:bg-rose-500",
    chipBg:
      "bg-rose-50/40 hover:bg-rose-50 dark:bg-rose-500/5 dark:hover:bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  HIGH: {
    pill: "bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/40",
    bar: "before:bg-orange-500",
    chipBg:
      "bg-orange-50/40 hover:bg-orange-50 dark:bg-orange-500/5 dark:hover:bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  MEDIUM: {
    pill: "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/40",
    bar: "before:bg-yellow-500",
    chipBg:
      "bg-yellow-50/40 hover:bg-yellow-50 dark:bg-yellow-500/5 dark:hover:bg-yellow-500/10",
    text: "text-yellow-700 dark:text-yellow-300",
    dot: "bg-yellow-500",
  },
  SAFE: {
    pill: "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/40",
    bar: "before:bg-emerald-500",
    chipBg:
      "bg-emerald-50/40 hover:bg-emerald-50 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
};
