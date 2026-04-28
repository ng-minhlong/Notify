// MinimizeWindowContext.tsx
import React, { createContext, useContext, useRef } from "react";

interface MinimizeWindowContextType {
  miniWindowRef: React.MutableRefObject<Window | null>;
  setMiniWindow: (w: Window | null) => void;
}

const MinimizeWindowContext = createContext<MinimizeWindowContextType | undefined>(undefined);

export function MinimizeWindowProvider({ children }: { children: React.ReactNode }) {
  const miniWindowRef = useRef<Window | null>(null);
  const setMiniWindow = (w: Window | null) => {
    miniWindowRef.current = w;
  };
  return (
    <MinimizeWindowContext.Provider value={{ miniWindowRef, setMiniWindow }}>
      {children}
    </MinimizeWindowContext.Provider>
  );
}

export function useMinimizeWindow() {
  const ctx = useContext(MinimizeWindowContext);
  if (!ctx) throw new Error("useMinimizeWindow must be used within MinimizeWindowProvider");
  return ctx;
}
