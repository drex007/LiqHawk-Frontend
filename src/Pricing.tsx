type Plan = {
  name: string;
  price: string;
  tagline: string;
  highlighted?: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "$29.99",
    tagline: "Get hands-on with LiqHawk's core risk feeds.",
    features: [
      "10,000 API requests / month",
      "Real-time positions for INIT Capital & Lendle",
      "Risk-level + health-factor endpoints",
      "Webhook alerts (up to 5 / minute)",
      "24-hour historical retention",
      "2 API keys",
      "Community Discord & email support",
    ],
  },
  {
    name: "Pro",
    price: "$49.99",
    tagline: "For builders running active liquidation strategies.",
    highlighted: true,
    features: [
      "100,000 API requests / month",
      "Everything in Starter",
      "Priority webhook alerts (30 / minute)",
      "Custom risk thresholds & advanced filters",
      "7-day historical retention + CSV exports",
      "Slack / Discord / Telegram integrations",
      "10 API keys with per-key scopes",
      "Priority email support (24h response)",
    ],
  },
  {
    name: "Enterprise",
    price: "$69.99",
    tagline: "Dedicated infra and the deepest data window.",
    features: [
      "Unlimited API requests (fair-use)",
      "Everything in Pro",
      "Custom webhook routing & dedicated workers",
      "90-day historical retention + raw block snapshots",
      "Unlimited API keys with IP allow-listing",
      "On-chain trigger automations",
      "Dedicated account manager",
      "24/7 support with 99.9% uptime SLA",
    ],
  },
];

export default function Pricing() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-600 dark:text-rose-300">
          API Plans
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          Liquidation intelligence, priced to scale.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Every plan ships with the same low-latency risk engine — pick the
          request volume, retention window, and SLA that fits your stack.
        </p>

        <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          Coming soon — public API is in private beta
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </section>

      <p className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400">
        All prices in USD per month · Cancel anytime · No setup fees · Stripe-secured checkout
      </p>
    </main>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-white p-6 transition dark:bg-slate-900/40 ${
        plan.highlighted
          ? "border-rose-400 shadow-lg shadow-rose-500/10 ring-2 ring-rose-300/40 dark:border-rose-500/60 dark:ring-rose-500/30"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-800/80 dark:hover:border-slate-700"
      }`}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Most popular
        </span>
      )}

      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {plan.name}
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {plan.tagline}
      </p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {plan.price}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          / month
        </span>
      </div>

      <ul className="mt-6 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckIcon
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                plan.highlighted ? "text-rose-500" : "text-emerald-500"
              }`}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        disabled
        title="Public API is launching soon"
        className="mt-7 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 py-2 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
      >
        Coming soon
      </button>
    </article>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
