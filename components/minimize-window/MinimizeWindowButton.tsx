// MinimizeWindowButton.tsx
import React from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpenMinimizeWindow } from "./useMinimizeWindow";

export function MinimizeWindowButton({ getEditorText }: { getEditorText: () => string }) {
  const { openMinimizeWindow } = useOpenMinimizeWindow(getEditorText);
  return (
    <Button variant="outline" size="sm" onClick={openMinimizeWindow}>
      <BookOpen className="w-4 h-4 mr-1" /> Open minimize window
    </Button>
  );
}
