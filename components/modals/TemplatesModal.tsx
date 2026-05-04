"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTemplates } from "@/hooks/useTemplatesModal";

export const TemplatesModal = () => {
  const templates = useTemplates();

  return (
    <Dialog open={templates.isOpen} onOpenChange={templates.onClose}>
      <DialogTitle hidden>Adaptive tools</DialogTitle>

      <DialogContent className="w-[90vw] max-w-none max-w-2xl">
        <DialogHeader className="border-b pb-3">
          <h2 className="text-xl font-semibold">
             More Tools 
          </h2>
          <p className="text-sm text-muted-foreground">
            Some tools below will be avaliable soon ! 
          </p>
          <div>
            <li>Quick search in all documents</li>
            <li>Distribution, graph for all documents</li>
            <li>ChatBot in all documents (Using RAG)</li>
          </div>
        </DialogHeader>

      </DialogContent>
    </Dialog>
  );
};