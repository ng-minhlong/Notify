"use client"
import { Calendar, Mic, Brain, Network, Workflow, Share2 } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const features = [
  { icon: Calendar, title: "Daily Notes", desc: "Organize thoughts by date — a living timeline of what you thought, made, and noticed." },
  { icon: Mic, title: "Voice to Note", desc: "Speak freely. Daily Flow transcribes and structures ideas into clean, searchable notes." },
  { icon: Brain, title: "AI Analysis", desc: "Surface summaries, themes, and quiet patterns hiding across weeks of writing." },
  { icon: Share2, title: "Mindmap Generator", desc: "Watch your notes unfold into a mindmap — see how ideas connect, automatically." },
  { icon: Workflow, title: "Flow Builder", desc: "Turn loose notes into structured flows: decisions, steps, outcomes you can act on." },
  { icon: Network, title: "Knowledge Graph", desc: "Every note becomes a node. Your second brain grows as you write." },
];

export function Features() {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="features" ref={ref} className="border-t border-hairline/60 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 max-w-2xl">
          <p className="reveal mb-3 text-xs font-medium uppercase tracking-[0.18em] text-brand">Features</p>
          <h2 className="reveal reveal-delay-1 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            A small set of tools,
            <br />
            <span className="text-text-3">designed to work together.</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`reveal reveal-delay-${(i % 3) + 1} group relative overflow-hidden rounded-2xl border border-hairline bg-surface-2/60 p-6 transition duration-300 hover:-translate-y-1 hover:border-hairline/80 hover:bg-surface-2 hover:shadow-float`}
            >
              <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-surface-3 text-brand">
                <f.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
