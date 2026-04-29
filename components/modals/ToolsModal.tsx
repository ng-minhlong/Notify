"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTools } from "@/hooks/useToolsModal";
import { Check } from "lucide-react";

export const ToolsModal = () => {
  const tools = useTools();

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
    <Dialog open={tools.isOpen} onOpenChange={tools.onClose}>
      <DialogTitle hidden>Upgrade your Plan</DialogTitle>

      <DialogContent className="w-[90vw] max-w-none">
        <DialogHeader className="border-b pb-3">
          <h2 className="text-xl font-semibold">
             More Tools
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose the plan that fits your needs
          </p>
        </DialogHeader>

      </DialogContent>
    </Dialog>
  );
};