"use client"
import { Check } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const benefits = [
  { title: "Think clearer", desc: "Less app-juggling. One place for the day's thinking." },
  { title: "Save time", desc: "AI does the summarizing so you can stay with the idea." },
  { title: "Turn chaos into structure", desc: "Loose notes become flows, mindmaps, decisions." },
  { title: "Build a second brain", desc: "A trustworthy archive that compounds quietly." },
];

export function Benefits() {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="benefits" ref={ref} className="border-t border-hairline/60 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="reveal mb-3 text-xs font-medium uppercase tracking-[0.18em] text-brand">Why Daily Flow</p>
            <h2 className="reveal reveal-delay-1 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              The point isn't more notes.
              <br />
              <span className="text-text-3">It's better thinking.</span>
            </h2>
            <p className="reveal reveal-delay-2 mt-5 max-w-md text-text-2">
              We built Daily Flow for people who write to think — not just to remember.
              The interface stays out of the way; structure appears when you need it.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {benefits.map((b, i) => (
              <li
                key={b.title}
                className={`reveal reveal-delay-${i + 1} group rounded-xl border border-hairline bg-surface-2/60 p-5 transition hover:-translate-y-0.5 hover:bg-surface-2`}
              >
                <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand/15 text-brand ring-1 ring-brand/30">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </div>
                <div className="text-[15px] font-semibold tracking-tight">{b.title}</div>
                <div className="mt-1 text-sm text-text-2">{b.desc}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
