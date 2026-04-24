"use client"
import { Calendar, Mic, Sparkles, Network } from "lucide-react";

export function AppMockup() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-brand/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface-2 shadow-float">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-hairline bg-surface-3/40 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-hairline" />
          <span className="h-2.5 w-2.5 rounded-full bg-hairline" />
          <span className="h-2.5 w-2.5 rounded-full bg-hairline" />
          <span className="ml-3 text-[11px] text-text-3">dailyflow.app — Tuesday, April 23</span>
        </div>

        <div className="grid grid-cols-12 gap-0">
          {/* Sidebar / calendar */}
          <aside className="col-span-4 border-r border-hairline bg-surface/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-text-3">
              <Calendar className="h-3.5 w-3.5" /> April 2026
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px]">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-center text-text-3/70">{d}</div>
              ))}
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const isToday = day === 23;
                const hasNote = [3, 7, 12, 18, 19, 23, 26].includes(day);
                return (
                  <div
                    key={i}
                    className={`flex aspect-square items-center justify-center rounded-md text-[10px] transition ${
                      isToday
                        ? "bg-brand text-white shadow-glow"
                        : hasNote
                        ? "bg-brand/15 text-text-1 ring-1 ring-brand/30"
                        : "text-text-3 hover:bg-surface-3"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 space-y-1">
              {["Morning pages", "Project Atlas", "Reading: Calm"].map((t) => (
                <div key={t} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-text-2 hover:bg-surface-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  {t}
                </div>
              ))}
            </div>
          </aside>

          {/* Note + mindmap */}
          <main className="col-span-8 p-5">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-text-3">Today</div>
            <h3 className="text-xl font-semibold tracking-tight">A quieter way to think</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-text-2">
              Spent the morning sketching the onboarding. The flow feels lighter when each day
              is its own page — less pressure, more presence.
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-medium text-brand ring-1 ring-brand/30">
              <Sparkles className="h-3 w-3" /> AI summary ready
            </div>

            {/* Mini mindmap */}
            <div className="mt-5 rounded-xl border border-hairline bg-surface/40 p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] text-text-3">
                <Network className="h-3 w-3" /> Generated mindmap
              </div>
              <svg viewBox="0 0 320 130" className="h-32 w-full">
                <g fill="none" stroke="currentColor" className="text-text-3/40" strokeWidth="1">
                  <path d="M160 65 C 110 65, 90 30, 50 30" className="animate-draw" />
                  <path d="M160 65 C 110 65, 90 100, 50 100" className="animate-draw" style={{ animationDelay: "0.1s" }} />
                  <path d="M160 65 C 210 65, 230 30, 270 30" className="animate-draw" style={{ animationDelay: "0.2s" }} />
                  <path d="M160 65 C 210 65, 230 100, 270 100" className="animate-draw" style={{ animationDelay: "0.3s" }} />
                </g>
                {[
                  { x: 160, y: 65, label: "Onboarding", center: true },
                  { x: 50, y: 30, label: "Daily" },
                  { x: 50, y: 100, label: "Voice" },
                  { x: 270, y: 30, label: "Mindmap" },
                  { x: 270, y: 100, label: "Flow" },
                ].map((n, i) => (
                  <g key={i}>
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.center ? 7 : 5}
                      className={n.center ? "fill-text-1" : "fill-brand"}
                    />
                    <text
                      x={n.x}
                      y={n.y - 12}
                      textAnchor="middle"
                      className="fill-text-2 text-[9px]"
                      style={{ fontFamily: "Inter" }}
                    >
                      {n.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </main>
        </div>
      </div>

      {/* Floating voice card */}
      <div className="animate-float-slow absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-xl border border-hairline bg-surface-2 px-4 py-3 shadow-float sm:flex">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-glow">
          <Mic className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] font-medium">Recording…</div>
          <div className="flex items-end gap-0.5 pt-1">
            {[3, 6, 4, 8, 5, 7, 3, 5, 4].map((h, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full bg-brand"
                style={{ height: `${h * 2}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
