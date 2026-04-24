import { PenLine, Sparkles, Network, Layers } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const steps = [
  { icon: PenLine, title: "Capture", desc: "Write or speak — whatever's faster in the moment." },
  { icon: Sparkles, title: "Process", desc: "AI quietly extracts themes, tasks, and key ideas." },
  { icon: Network, title: "Visualize", desc: "See thoughts as a mindmap or a structured flow." },
  { icon: Layers, title: "Refine", desc: "Tidy, link, and grow a second brain that compounds." },
];

export function HowItWorks() {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="how" ref={ref} className="relative border-t border-hairline/60 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="reveal mb-3 text-xs font-medium uppercase tracking-[0.18em] text-brand">How it works</p>
            <h2 className="reveal reveal-delay-1 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              Four steps, mostly invisible.
            </h2>
          </div>
          <p className="reveal reveal-delay-2 max-w-sm text-sm text-text-2">
            You write. We do the quiet work in the background — so structure
            appears without ever interrupting the thought.
          </p>
        </div>

        <ol className="relative grid gap-10 md:grid-cols-4">
          <div className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-hairline to-transparent md:block" />

          {steps.map((s, i) => (
            <li key={s.title} className={`reveal reveal-delay-${i + 1} relative`}>
              <div className="flex items-center gap-3">
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface-2 text-brand shadow-soft">
                  <s.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <span className="text-xs font-medium text-text-3">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-2">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
