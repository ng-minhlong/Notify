import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-hairline/60 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand/15 ring-1 ring-brand/40 text-brand">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Daily Flow</span>
          <span className="ml-3 text-xs text-text-3">© 2026</span>
        </div>

        <nav className="grid grid-cols-3 gap-10 text-sm text-text-2">
          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-widest text-text-3">Product</div>
            <a href="#features" className="block transition hover:text-text-1">Features</a>
            <a href="#preview" className="block transition hover:text-text-1">Preview</a>
            <a href="#pricing" className="block transition hover:text-text-1">Pricing</a>
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-widest text-text-3">Learn</div>
            <a href="#how" className="block transition hover:text-text-1">How it works</a>
            <a href="#benefits" className="block transition hover:text-text-1">Why Daily Flow</a>
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-widest text-text-3">Contact</div>
            <a href="#" className="block transition hover:text-text-1">hello@dailyflow.app</a>
            <a href="#" className="block transition hover:text-text-1">Twitter</a>
          </div>
        </nav>
      </div>
    </footer>
  );
}
