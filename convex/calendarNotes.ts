import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createNote = mutation({
  args: {
    date: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    timeType: v.union(v.literal("all_day"), v.literal("specific_time")),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;
    const now = Date.now();

    return await ctx.db.insert("calendarNotes", {
      userId,
      date: args.date,
      title: args.title,
      description: args.description,
      timeType: args.timeType,
      startTime: args.startTime,
      endTime: args.endTime,
      color: args.color || "#3b82f6",
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getNotesByDate = query({
  args: {
    date: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    return await ctx.db
      .query("calendarNotes")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("asc")
      .collect();
  },
});

export const getNotesByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    return await ctx.db
      .query("calendarNotes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate),
          q.eq(q.field("isArchived"), false)
        )
      )
      .order("asc")
      .collect();
  },
});

export const getNotesCount = query({
  args: {
    date: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    const notes = await ctx.db
      .query("calendarNotes")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    return notes.length;
  },
});

export const getMultipleDatesCount = query({
  args: {
    dates: v.array(v.string()),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;
    const countMap: Record<string, number> = {};

    for (const date of args.dates) {
      const notes = await ctx.db
        .query("calendarNotes")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
        .filter((q) => q.eq(q.field("isArchived"), false))
        .collect();

      countMap[date] = notes.length;
    }

    return countMap;
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("calendarNotes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    timeType: v.optional(v.union(v.literal("all_day"), v.literal("specific_time"))),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;
    const note = await ctx.db.get(args.noteId);

    if (!note || note.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.noteId, {
      title: args.title ?? note.title,
      description: args.description ?? note.description,
      timeType: args.timeType ?? note.timeType,
      startTime: args.startTime ?? note.startTime,
      endTime: args.endTime ?? note.endTime,
      color: args.color ?? note.color,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.noteId);
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("calendarNotes"),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;
    const note = await ctx.db.get(args.noteId);

    if (!note || note.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.noteId, {
      isArchived: true,
      updatedAt: Date.now(),
    });
  },
});

export const permanentlyDeleteNote = mutation({
  args: {
    noteId: v.id("calendarNotes"),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;
    const note = await ctx.db.get(args.noteId);

    if (!note || note.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.noteId);
  },
});
