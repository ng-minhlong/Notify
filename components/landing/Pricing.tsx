import { Check } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    desc: "For getting started with daily notes.",
    features: [
      "Daily notes, unlimited",
      "Basic note editor",
      "Limited AI usage (50/mo)",
      "Local-first storage",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Plus",
    price: "$9",
    cadence: "/month",
    desc: "For thinkers who want AI in the loop.",
    features: [
      "Everything in Free",
      "Voice to note",
      "Mindmap generation",
      "1,500 AI actions / month",
      "Cloud sync",
    ],
    cta: "Start 14-day trial",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "/month",
    desc: "For power users building a second brain.",
    features: [
      "Everything in Plus",
      "Unlimited AI usage",
      "Advanced flow builder",
      "Priority processing",
      "Priority support",
    ],
    cta: "Go Pro",
    highlighted: false,
  },
];

export function Pricing() {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="pricing" ref={ref} className="border-t border-hairline/60 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <p className="reveal mb-3 text-xs font-medium uppercase tracking-[0.18em] text-brand">Pricing</p>
          <h2 className="reveal reveal-delay-1 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            Simple plans. No surprises.
          </h2>
          <p className="reveal reveal-delay-2 mx-auto mt-4 max-w-md text-text-2">
            Start free. Upgrade when AI becomes part of your daily practice.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((p, i) => (
            <div
              key={p.name}
              className={`reveal reveal-delay-${i + 1} relative rounded-2xl border p-7 transition hover:-translate-y-1 ${
                p.highlighted
                  ? "border-brand/50 bg-surface-2 shadow-glow"
                  : "border-hairline bg-surface-2/60 hover:border-hairline/80 hover:bg-surface-2"
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[11px] font-medium text-white shadow-glow">
                  Most popular
                </div>
              )}

              <div className="text-sm font-medium text-text-2">{p.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                <span className="text-sm text-text-3">{p.cadence}</span>
              </div>
              <p className="mt-2 text-sm text-text-2">{p.desc}</p>

              <a
                href="#cta"
                className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  p.highlighted
                    ? "bg-brand text-white hover:bg-brand/90"
                    : "border border-hairline bg-surface-3/60 text-text-1 hover:bg-surface-3"
                }`}
              >
                {p.cta}
              </a>

              <div className="mt-6 h-px w-full bg-hairline" />

              <ul className="mt-5 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-text-2">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-brand" strokeWidth={2.25} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
