"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSpeechMode } from "@/hooks/useSpeechMode";
import { useRouter } from "next/navigation";




export const SpeechMode = () => {
  const speechMode = useSpeechMode();
  const router = useRouter();

  

  return (
    <Dialog open={speechMode.isOpen} onOpenChange={speechMode.onClose}>
      <DialogTitle hidden>Choose mode</DialogTitle>

      <DialogContent className="w-[90vw] max-w-none">
        <DialogHeader className="border-b pb-3">
          <h2 className="text-xl font-semibold">Choose mode</h2>
          <p className="text-sm text-muted-foreground">
            Choose the mode below that fit your tasks
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 max-w-none">
           <button><p>Simple Voice mode (STT)</p></button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
         
        </p>
      </DialogContent>
    </Dialog>
  );
};