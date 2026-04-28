"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpgrade } from "@/hooks/useUpgradeModal";
import { Check } from "lucide-react";

export const UpgradeModal = () => {
  const upgrade = useUpgrade();

  const plans = [
    {
      name: "Free",
      price: "$0",
      desc: "Basic usage for individuals",
      features: [
        "5 credits / day",
        "Basic features",
        "Community support",
      ],
      highlight: false,
    },
    {
      name: "Pro",
      price: "$9",
      desc: "For power users",
      features: [
        "100 credits / day",
        "Priority speed",
        "Advanced features",
      ],
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "For teams & businesses",
      features: [
        "Unlimited credits",
        "Team management",
        "Dedicated support",
      ],
      highlight: false,
    },
  ];

  return (
    <Dialog open={upgrade.isOpen} onOpenChange={upgrade.onClose}>
      <DialogTitle hidden>Upgrade your Plan</DialogTitle>

      <DialogContent className="w-[90vw] max-w-none">
        <DialogHeader className="border-b pb-3">
          <h2 className="text-xl font-semibold">
            Upgrade your plan
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose the plan that fits your needs
          </p>
        </DialogHeader>

        {/* 🔥 3 COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-5 flex flex-col justify-between transition
              ${
                plan.highlight
                  ? "border-black dark:border-white shadow-lg scale-[1.03]"
                  : "border-muted"
              }`}
            >
              {/* TOP */}
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-2xl font-bold mt-2">{plan.price}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan.desc}
                </p>

                {/* FEATURES */}
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* BUTTON */}
              <button
                className={`mt-6 w-full rounded-lg py-2 text-sm font-medium transition
                ${
                  plan.highlight
                    ? "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {plan.name === "Free" ? "Current Plan" : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};