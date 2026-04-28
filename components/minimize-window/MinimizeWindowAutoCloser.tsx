import { useEffect } from "react";
import { useOpenMinimizeWindow } from "./useMinimizeWindow";

export function MinimizeWindowAutoCloser({ getEditorText, documentId }: { getEditorText: () => string, documentId: string }) {
  const { closeMiniWindow } = useOpenMinimizeWindow(getEditorText);
  useEffect(() => {
    closeMiniWindow();
    return () => {
      closeMiniWindow();
    };
  }, [documentId]);
  return null;
}
