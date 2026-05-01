import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";

export const useCalendarNoteCount = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  
  const count = useQuery(api.calendarNotes.getNotesCount, {
    date: today,
  });

  return count ?? 0;
};

export const useCalendarNoteCounts = (dates: string[]) => {
  const countMap = useQuery(api.calendarNotes.getMultipleDatesCount, {
    dates,
  });

  return countMap ?? {};
};
