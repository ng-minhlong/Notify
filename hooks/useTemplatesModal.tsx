import { create } from "zustand";

type TemplatesStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useTemplates = create<TemplatesStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
