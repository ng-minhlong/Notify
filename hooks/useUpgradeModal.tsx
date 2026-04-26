import { create } from "zustand";

type UpgradeStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useUpgrade = create<UpgradeStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
