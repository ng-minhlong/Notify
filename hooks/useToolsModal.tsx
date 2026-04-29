import { create } from "zustand";

type ToolsStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useTools = create<ToolsStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
