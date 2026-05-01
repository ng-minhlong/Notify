"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCalendar } from "@/hooks/useCalendarModal";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Edit2, Trash2, Clock, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const COLOR_OPTIONS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
];

export const CalendarModal = () => {
  const calendar = useCalendar();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeType, setTimeType] = useState<"all_day" | "specific_time">("all_day");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const dateString = date ? format(date, "yyyy-MM-dd") : "";
  
  const notes = useQuery(api.calendarNotes.getNotesByDate, {
    date: dateString,
  });

  const createNoteMutation = useMutation(api.calendarNotes.createNote);
  const updateNoteMutation = useMutation(api.calendarNotes.updateNote);
  const deleteNoteMutation = useMutation(api.calendarNotes.deleteNote);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !dateString) return;

    try {
      if (editingId) {
        await updateNoteMutation({
          noteId: editingId as any,
          title,
          description,
          timeType,
          startTime: timeType === "specific_time" ? startTime : undefined,
          endTime: timeType === "specific_time" ? endTime : undefined,
          color: selectedColor,
        });
        setEditingId(null);
      } else {
        await createNoteMutation({
          date: dateString,
          title,
          description,
          timeType,
          startTime: timeType === "specific_time" ? startTime : undefined,
          endTime: timeType === "specific_time" ? endTime : undefined,
          color: selectedColor,
        });
      }

      // Reset form
      setTitle("");
      setDescription("");
      setTimeType("all_day");
      setStartTime("09:00");
      setEndTime("10:00");
      setSelectedColor(COLOR_OPTIONS[0]);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleEdit = (note: any) => {
    setEditingId(note._id);
    setTitle(note.title);
    setDescription(note.description || "");
    setTimeType(note.timeType);
    setStartTime(note.startTime || "09:00");
    setEndTime(note.endTime || "10:00");
    setSelectedColor(note.color || COLOR_OPTIONS[0]);
    setShowForm(true);
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNoteMutation({ noteId: noteId as any });
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setTimeType("all_day");
    setStartTime("09:00");
    setEndTime("10:00");
    setSelectedColor(COLOR_OPTIONS[0]);
  };

  return (
    <Dialog open={calendar.isOpen} onOpenChange={calendar.onClose}>
      <DialogTitle hidden>Calendar</DialogTitle>
      <DialogContent className="dark:bg-dark max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-2">
          <h2 className="text-lg font-semibold">My Calendar & Notes</h2>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          {/* Calendar */}
          <div className="md:col-span-1 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-lg border"
            />
          </div>

          {/* Notes Section */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">
                {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
              </p>
            </div>

            {/* Notes List */}
            {notes && notes.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Notes ({notes.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {notes.map((note: any) => (
                    <div
                      key={note._id}
                      className="p-3 rounded-lg border-l-4 bg-card hover:shadow-sm transition"
                      style={{ borderLeftColor: note.color || "#3b82f6" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{note.title}</p>
                          {note.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {note.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {note.timeType === "all_day" ? (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                <CalendarIcon className="w-3 h-3" />
                                All day
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                <Clock className="w-3 h-3" />
                                {note.startTime} - {note.endTime}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(note)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(note._id)}
                            className="h-8 w-8 p-0 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Note Button or Form */}
            {!showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                className="w-full mt-2"
                variant="outline"
              >
                + Add Note
              </Button>
            ) : (
              <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4 bg-muted/50">
                <h4 className="font-semibold text-sm">
                  {editingId ? "Edit Note" : "New Note"}
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Meeting with team"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm">
                    Description (optional)
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add more details..."
                  />
                </div>

                {/* Time Type Selection */}
                <div className="space-y-2">
                  <Label className="text-sm">Time Type</Label>
                  <Tabs value={timeType} onValueChange={(v) => setTimeType(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="all_day">All Day</TabsTrigger>
                      <TabsTrigger value="specific_time">Time Range</TabsTrigger>
                    </TabsList>

                    <TabsContent value="specific_time" className="space-y-3 mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="startTime" className="text-xs">
                            Start Time
                          </Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endTime" className="text-xs">
                            End Time
                          </Label>
                          <Input
                            id="endTime"
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Color Selection */}
                <div className="space-y-2">
                  <Label className="text-sm">Color</Label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition",
                          selectedColor === color ? "border-foreground" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingId ? "Save" : "Add Note"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
