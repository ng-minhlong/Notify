"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpgrade } from "@/hooks/useUpgradeModal";
import { Check, Sparkles } from "lucide-react";

export const UpgradeModal = () => {
  const upgrade = useUpgrade();

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "month",
      desc: "For personal note-taking & light AI usage",
      features: [
        "Unlimited notes",
        "Note basics: text, image, edit, voice, icon",
        "Favourite notes + note calendar",
        "100MB storage for image + voice",
        "50 AI credits / month",
        "Low daily AI cap",
        "Basic AI: ask AI + summary",
      ],
      highlight: false,
      badge: null,
      button: "Current Plan",
    },
    {
      name: "Starter",
      price: "$10",
      period: "month",
      desc: "For regular users who want more AI",
      features: [
        "Unlimited notes",
        "Note basics: text, image, edit, voice, icon",
        "Favourite notes + note calendar",
        "500MB storage for image + voice",
        "250 AI credits / month",
        "Medium daily AI cap",
        "Ask AI + summary + read note aloud",
        "Faster processing than Free",
      ],
      highlight: true,
      badge: "Most Popular",
      button: "Upgrade to Starter",
    },
    {
      name: "Pro",
      price: "$20",
      period: "month",
      desc: "For heavy AI usage and power users",
      features: [
        "Unlimited notes",
        "Note basics: text, image, edit, voice, icon",
        "Favourite notes + note calendar",
        "5GB storage for image + voice",
        "1000 AI credits / month",
        "High daily AI cap",
        "Ask AI + summary + read note aloud",
        "Speech mode with Whisper",
        "Mindmap generation from notes",
        "Bulk AI actions + priority processing",
      ],
      highlight: false,
      badge: null,
      button: "Upgrade to Pro",
    },
  ];

  return (
    <Dialog open={upgrade.isOpen} onOpenChange={upgrade.onClose}>
      <DialogTitle hidden>Upgrade your Plan</DialogTitle>

      <DialogContent className="w-[90vw] max-w-none">
        <DialogHeader className="border-b pb-3">
          <h2 className="text-xl font-semibold">Upgrade your plan</h2>
          <p className="text-sm text-muted-foreground">
            Choose the plan that fits how much AI and storage you need
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 max-w-none">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col justify-between transition ${
                plan.highlight
                  ? "border-black dark:border-white shadow-xl scale-[1.03] relative"
                  : "border-muted"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-black">
                  <Sparkles className="h-3.5 w-3.5" />
                  {plan.badge}
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>

                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-bold">{plan.price}</p>
                  <p className="pb-1 text-sm text-muted-foreground">
                    / {plan.period}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  {plan.desc}
                </p>

                <ul className="mt-5 space-y-2 text-sm">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`mt-6 w-full rounded-lg py-2 text-sm font-medium transition ${
                  plan.highlight
                    ? "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {plan.button}
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Extra storage: $1 / 100MB. AI credits reset monthly.
        </p>
      </DialogContent>
    </Dialog>
  );
};