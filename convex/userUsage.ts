import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

//
// ✅ GET USER USAGE
//
export const getUserUsage = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return usage;
  },
});

//
// ✅ LAZY CREATE USER USAGE
//
export const getOrCreateUserUsage = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existing = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) return existing;

    const now = Date.now();

    const id = await ctx.db.insert("userUsage", {
      userId,

      // STORAGE
      storageUsed: 0,

      // AI USAGE
      aiHourlyUsed: 0,
      aiHourlyResetAt: getNextHour(),

      aiDailyUsed: 0,
      aiDailyResetAt: getNextDay(),

      aiWeeklyUsed: 0,
      aiWeeklyResetAt: getNextWeek(),

      aiMonthlyUsed: 0,
      aiMonthlyResetAt: getNextMonth(),

      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

//
// 🔥 CORE: CHECK + CONSUME USAGE (IMPORTANT)
//
export const consumeAIUsage = mutation({
  args: {
    amount: v.number(), // số request hoặc credits
  },
  handler: async (ctx, { amount }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    let usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!usage) {
      // lazy create nếu chưa có
      const now = Date.now();
      const id = await ctx.db.insert("userUsage", {
        userId,
        storageUsed: 0,

        aiHourlyUsed: 0,
        aiHourlyResetAt: getNextHour(),

        aiDailyUsed: 0,
        aiDailyResetAt: getNextDay(),

        aiWeeklyUsed: 0,
        aiWeeklyResetAt: getNextWeek(),

        aiMonthlyUsed: 0,
        aiMonthlyResetAt: getNextMonth(),

        updatedAt: now,
      });

      usage = await ctx.db.get(id);
      if (!usage) throw new Error("Failed to create usage");
    }

    const now = Date.now();

    // 🔥 RESET LOGIC
    let {
      aiHourlyUsed,
      aiHourlyResetAt,
      aiDailyUsed,
      aiDailyResetAt,
      aiWeeklyUsed,
      aiWeeklyResetAt,
      aiMonthlyUsed,
      aiMonthlyResetAt,
    } = usage;

    if (now > aiHourlyResetAt) {
      aiHourlyUsed = 0;
      aiHourlyResetAt = getNextHour();
    }

    if (now > aiDailyResetAt) {
      aiDailyUsed = 0;
      aiDailyResetAt = getNextDay();
    }

    if (now > aiWeeklyResetAt) {
      aiWeeklyUsed = 0;
      aiWeeklyResetAt = getNextWeek();
    }

    if (now > aiMonthlyResetAt) {
      aiMonthlyUsed = 0;
      aiMonthlyResetAt = getNextMonth();
    }

    // 🔥 UPDATE USAGE
    await ctx.db.patch(usage._id, {
      aiHourlyUsed: aiHourlyUsed + amount,
      aiHourlyResetAt,

      aiDailyUsed: aiDailyUsed + amount,
      aiDailyResetAt,

      aiWeeklyUsed: aiWeeklyUsed + amount,
      aiWeeklyResetAt,

      aiMonthlyUsed: aiMonthlyUsed + amount,
      aiMonthlyResetAt,

      updatedAt: now,
    });

    return {
      success: true,
    };
  },
});

//
// 🧠 TIME HELPERS
//
function getNextHour() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.getTime();
}

function getNextDay() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function getNextWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = 7 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getNextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}