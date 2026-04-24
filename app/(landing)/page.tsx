"use client"
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { AppMockup } from "@/components/landing/AppMockup";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Preview } from "@/components/landing/Preview";
import { Benefits } from "@/components/landing/Benefits";
import { Pricing } from "@/components/landing/Pricing";
import { CTA } from "@/components/landing/CTA";

import { useReveal } from "@/hooks/use-reveal";
import { Footer } from "@/components/landing/Footer";




export default function Page() {
  const heroRef = useReveal<HTMLDivElement>();

  return (
    
    <div className="min-h-screen bg-background text-foreground">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-spotlight" />
        <div className="absolute inset-0 -z-10 bg-grid opacity-60" />

        <div ref={heroRef} className="mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
          <div className="grid items-center gap-16 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="reveal inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-2/70 px-3 py-1 text-xs text-text-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-brand shadow-glow" />
                Now in private beta
              </div>

              <h1 className="reveal reveal-delay-1 mt-6 text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
                Capture your thoughts.
                <br />
                <span className="text-shimmer">Let AI shape them.</span>
              </h1>

              <p className="reveal reveal-delay-2 mt-6 max-w-lg text-lg leading-relaxed text-text-2">
                Daily Flow is a calm note-taking space organised by day. Speak or
                write, and watch your ideas turn into summaries, mindmaps, and flows —
                quietly, in the background.
              </p>

              <div className="reveal reveal-delay-3 mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#cta"
                  className="group inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white shadow-glow transition hover:bg-brand/90"
                >
                  Try it free
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-5 py-3 text-sm font-medium text-text-1 transition hover:bg-surface-3"
                >
                  How it works
                </a>
              </div>

              <div className="reveal reveal-delay-4 mt-10 flex items-center gap-5 text-xs text-text-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-3 w-3 fill-brand text-brand" />
                    ))}
                  </div>
                  <span>Loved by 2,400+ writers</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                  <Sparkles className="h-3 w-3 text-brand" />
                  No setup required
                </span>
              </div>
            </div>

            <div className="reveal reveal-delay-2 lg:col-span-6">
              <AppMockup />
            </div>
          </div>
        </div>
      </section>

      <Features />
      <HowItWorks />
      <Preview />
      <Benefits />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
