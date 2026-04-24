"use client"
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useReveal } from "@/hooks/use-reveal";

export function CTA() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const ref = useReveal<HTMLElement>();

  return (
    <section id="cta" ref={ref} className="relative border-t border-hairline/60 py-28">
      <div className="absolute inset-0 -z-10 bg-spotlight opacity-90" />
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="reveal text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          Start building your
          <br />
          <span className="text-shimmer">second brain today.</span>
        </h2>
        <p className="reveal reveal-delay-1 mx-auto mt-5 max-w-md text-text-2">
          Join the early users shaping Daily Flow. Free during beta — no credit card.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) setSent(true);
          }}
          className="reveal reveal-delay-2 mx-auto mt-10 flex max-w-md items-center gap-2 rounded-full border border-hairline bg-surface-2 p-1.5 shadow-soft focus-within:border-brand/50 focus-within:shadow-glow"
        >
          <input
            type="email"
            required
            placeholder="you@thinking.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-text-3"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            {sent ? "On the list" : "Get started"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <p className="reveal reveal-delay-3 mt-4 text-xs text-text-3">No spam. One short email when it's your turn.</p>
      </div>
    </section>
  );
}
