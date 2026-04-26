import { create } from "zustand";

type CalendarStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useCalendar = create<CalendarStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
