import { Sparkles } from "lucide-react";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand/15 ring-1 ring-brand/40 text-brand">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Daily Flow</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-text-2 md:flex">
          <a href="#features" className="transition hover:text-text-1">Features</a>
          <a href="#how" className="transition hover:text-text-1">How it works</a>
          <a href="#preview" className="transition hover:text-text-1">Preview</a>
          <a href="#pricing" className="transition hover:text-text-1">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/login" className="hidden text-sm text-text-2 transition hover:text-text-1 sm:inline">Sign in</a>
          <a
            href="/register"
            className="rounded-lg bg-text-1 px-3.5 py-1.5 text-sm font-medium text-surface transition hover:bg-white"
          >
            Get started
          </a>
        </div>
      </div>
    </header>
  );
}
