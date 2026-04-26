"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCalendar } from "@/hooks/useCalendarModal";
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react";


export const CalendarModal = () => {
  const calendar = useCalendar();

    const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Dialog open={calendar.isOpen} onOpenChange={calendar.onClose}>
      <DialogTitle hidden>Calendar</DialogTitle>
      <DialogContent className="dark:bg-dark">
        <DialogHeader className="border-b pb-2">
          <h2 className="text-lg font-medium">Calendar</h2>
        </DialogHeader>
        <div className="divide-primary/10 divide-y">
          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col gap-y-1">
              <span className="text-muted-foreground text-[0.8rem]">
                Customize how Notify looks on your device.
              </span>
            </div>
          </div>
          <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-lg border"
            />
         
        </div>
      </DialogContent>
    </Dialog>
  );
};
