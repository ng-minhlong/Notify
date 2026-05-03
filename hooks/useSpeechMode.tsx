import { create } from "zustand";

type SpeechMode = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useSpeechMode = create<SpeechMode>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
