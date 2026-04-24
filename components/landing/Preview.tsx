"use client"
import { useState } from "react";
import { Calendar, FileText, Network } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const tabs = [
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "editor", label: "Note editor", icon: FileText },
  { id: "mindmap", label: "Mindmap", icon: Network },
] as const;

export function Preview() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("calendar");
  const ref = useReveal<HTMLElement>();

  return (
    <section id="preview" ref={ref} className="border-t border-hairline/60 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="reveal mb-3 text-xs font-medium uppercase tracking-[0.18em] text-brand">Inside the app</p>
          <h2 className="reveal reveal-delay-1 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            Calm surfaces. Considered details.
          </h2>
        </div>

        <div className="reveal reveal-delay-2 mb-6 inline-flex rounded-full border border-hairline bg-surface-2 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${
                active === t.id
                  ? "bg-brand text-white shadow-glow"
                  : "text-text-2 hover:text-text-1"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="reveal reveal-delay-3 overflow-hidden rounded-2xl border border-hairline bg-surface-2 shadow-float transition-transform duration-500 hover:scale-[1.005]">
          {active === "calendar" && <CalendarView />}
          {active === "editor" && <EditorView />}
          {active === "mindmap" && <MindmapView />}
        </div>
      </div>
    </section>
  );
}

function CalendarView() {
  return (
    <div className="grid grid-cols-7 gap-px bg-hairline">
      {Array.from({ length: 28 }).map((_, i) => {
        const day = i + 1;
        const notes = [
          day === 3 && "Sketch ideas",
          day === 7 && "Reading notes",
          day === 12 && "Team sync",
          day === 18 && "Walk + voice memo",
          day === 19 && "AI summary",
          day === 23 && "Onboarding flow",
          day === 26 && "Mindmap review",
        ].filter(Boolean) as string[];
        return (
          <div key={i} className="min-h-24 bg-surface-2 p-3 transition hover:bg-surface-3/50">
            <div className="text-xs text-text-3">{day}</div>
            <div className="mt-2 space-y-1">
              {notes.map((n) => (
                <div
                  key={n}
                  className="truncate rounded-md bg-brand/15 px-2 py-1 text-[11px] text-text-1 ring-1 ring-brand/25"
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EditorView() {
  return (
    <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
      <div className="border-b border-hairline p-6 md:border-b-0 md:border-r">
        <div className="text-[10px] uppercase tracking-widest text-text-3">April 23</div>
        <h3 className="mt-1 text-xl font-semibold tracking-tight">Onboarding flow</h3>
        <p className="mt-3 text-sm leading-relaxed text-text-2">
          The first three minutes should feel like opening a fresh notebook.
          No decisions, no setup — just a date and a blinking cursor.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-text-1">
          <li>• One screen, one prompt</li>
          <li>• Voice as a first-class option</li>
          <li>• AI waits, never interrupts</li>
        </ul>
      </div>
      <div className="bg-surface/40 p-6 md:col-span-2">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-medium text-brand ring-1 ring-brand/30">
          AI insights
        </div>
        <div className="space-y-3 text-sm">
          {[
            { k: "Theme", v: "Reducing friction in the first session" },
            { k: "Action", v: "Draft a 3-step onboarding by Friday" },
            { k: "Linked notes", v: "Apr 18 · Apr 19 · Apr 22" },
          ].map((row) => (
            <div key={row.k} className="rounded-lg border border-hairline bg-surface-2 p-3">
              <div className="text-[11px] font-medium text-text-3">{row.k}</div>
              <div className="text-text-1">{row.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MindmapView() {
  const nodes = [
    { x: 400, y: 150, label: "Daily Flow", center: true, r: 10 },
    { x: 180, y: 70, label: "Capture", r: 7 },
    { x: 180, y: 230, label: "Voice", r: 7 },
    { x: 620, y: 70, label: "Insights", r: 7 },
    { x: 620, y: 230, label: "Mindmap", r: 7 },
    { x: 90, y: 30, label: "Daily page" },
    { x: 90, y: 110, label: "Quick note" },
    { x: 90, y: 200, label: "Memo" },
    { x: 90, y: 270, label: "Transcribe" },
    { x: 720, y: 30, label: "Themes" },
    { x: 720, y: 110, label: "Summary" },
    { x: 720, y: 200, label: "Branches" },
    { x: 720, y: 270, label: "Flow" },
  ];
  const edges = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 5], [1, 6], [2, 7], [2, 8],
    [3, 9], [3, 10], [4, 11], [4, 12],
  ];
  return (
    <div className="bg-surface/40 p-6">
      <svg viewBox="0 0 800 300" className="h-[320px] w-full">
        <g stroke="currentColor" className="text-text-3/40" fill="none" strokeWidth="1">
          {edges.map(([a, b], i) => (
            <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
          ))}
        </g>
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r ?? 4}
              className={n.center ? "fill-text-1" : "fill-brand"}
            />
            <text
              x={n.x}
              y={n.y - (n.r ? n.r + 8 : 10)}
              textAnchor="middle"
              className="fill-text-2 text-[11px]"
              style={{ fontFamily: "Inter" }}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
