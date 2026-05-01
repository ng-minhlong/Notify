import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Import plan limits
type PlanName = "Free" | "Starter" | "Pro";

interface PlanLimits {
  aiCreditsPerHour: number;
  aiCreditsPerDay: number;
  aiCreditsPerWeek: number;
  aiCreditsPerMonth: number;
}

const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  Free: {
    aiCreditsPerHour: 5,
    aiCreditsPerDay: 10,
    aiCreditsPerWeek: 20,
    aiCreditsPerMonth: 50,
  },
  Starter: {
    aiCreditsPerHour: 15,
    aiCreditsPerDay: 30,
    aiCreditsPerWeek: 100,
    aiCreditsPerMonth: 250,
  },
  Pro: {
    aiCreditsPerHour: 30,
    aiCreditsPerDay: 100,
    aiCreditsPerWeek: 200,
    aiCreditsPerMonth: 500,
  },
};

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
// 🔥 CHECK + CONSUME AI USAGE WITH LIMIT VALIDATION
//
export const checkAndConsumeAIUsage = mutation({
  args: {
    amount: v.number(),
  },
  handler: async (ctx, { amount }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    // Get user plan
    const userPlan = await ctx.db
      .query("userPlan")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userPlan) throw new Error("User plan not found");

    const planType = userPlan.plan || "free";
    const planKey = 
      planType === "pro"
        ? "Pro"
        : planType === "starter"
        ? "Starter"
        : "Free";

    const limits = PLAN_LIMITS[planKey];

    // Get or create usage
    let usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!usage) {
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

    // Apply reset logic
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

    // ✅ CHECK LIMITS BEFORE CONSUMING
    const newHourlyUsed = aiHourlyUsed + amount;
    const newDailyUsed = aiDailyUsed + amount;
    const newWeeklyUsed = aiWeeklyUsed + amount;
    const newMonthlyUsed = aiMonthlyUsed + amount;

    if (newHourlyUsed > limits.aiCreditsPerHour) {
      throw new Error(
        `Hourly limit exceeded. Limit: ${limits.aiCreditsPerHour}, Used: ${aiHourlyUsed}`
      );
    }

    if (newDailyUsed > limits.aiCreditsPerDay) {
      throw new Error(
        `Daily limit exceeded. Limit: ${limits.aiCreditsPerDay}, Used: ${aiDailyUsed}`
      );
    }

    if (newWeeklyUsed > limits.aiCreditsPerWeek) {
      throw new Error(
        `Weekly limit exceeded. Limit: ${limits.aiCreditsPerWeek}, Used: ${aiWeeklyUsed}`
      );
    }

    if (newMonthlyUsed > limits.aiCreditsPerMonth) {
      throw new Error(
        `Monthly limit exceeded. Limit: ${limits.aiCreditsPerMonth}, Used: ${aiMonthlyUsed}`
      );
    }

    // ✅ ALL CHECKS PASSED - UPDATE USAGE
    await ctx.db.patch(usage._id, {
      aiHourlyUsed: newHourlyUsed,
      aiHourlyResetAt,

      aiDailyUsed: newDailyUsed,
      aiDailyResetAt,

      aiWeeklyUsed: newWeeklyUsed,
      aiWeeklyResetAt,

      aiMonthlyUsed: newMonthlyUsed,
      aiMonthlyResetAt,

      updatedAt: now,
    });

    return {
      success: true,
      usage: {
        hourly: { used: newHourlyUsed, limit: limits.aiCreditsPerHour },
        daily: { used: newDailyUsed, limit: limits.aiCreditsPerDay },
        weekly: { used: newWeeklyUsed, limit: limits.aiCreditsPerWeek },
        monthly: { used: newMonthlyUsed, limit: limits.aiCreditsPerMonth },
      },
    };
  },
});

//
// 🔥 CHECK + CONSUME STORAGE WITH LIMIT VALIDATION
//
export const checkAndConsumeStorage = mutation({
  args: {
    fileSizeBytes: v.number(), // kích thước file tính bằng bytes
  },
  handler: async (ctx, { fileSizeBytes }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    // Get user plan
    const userPlan = await ctx.db
      .query("userPlan")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userPlan) throw new Error("User plan not found");

    // Map plan to storage limit - need to import PLAN_LIMITS storage bytes
    const storageLimits: Record<string, number> = {
      free: 100 * 1024 * 1024, // 100MB
      starter: 500 * 1024 * 1024, // 500MB
      pro: 5 * 1024 * 1024 * 1024, // 5GB
    };

    const planType = userPlan.plan || "free";
    const storageLimit = storageLimits[planType] || storageLimits.free;

    // Get or create usage
    let usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!usage) {
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

    const currentStorageUsed = usage.storageUsed || 0;
    const newStorageUsed = currentStorageUsed + fileSizeBytes;

    // ✅ CHECK STORAGE LIMIT
    if (newStorageUsed > storageLimit) {
      const storageLimitMB = storageLimit / (1024 * 1024);
      const newStorageUsedMB = newStorageUsed / (1024 * 1024);
      throw new Error(
        `Storage limit exceeded. Limit: ${storageLimitMB.toFixed(2)}MB, Would be: ${newStorageUsedMB.toFixed(2)}MB`
      );
    }

    // ✅ UPDATE STORAGE
    await ctx.db.patch(usage._id, {
      storageUsed: newStorageUsed,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      storageUsed: newStorageUsed,
      storageLimit,
    };
  },
});

//
// 🔥 FREE STORAGE (when file is deleted)
//
export const freeStorage = mutation({
  args: {
    fileSizeBytes: v.number(),
  },
  handler: async (ctx, { fileSizeBytes }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!usage) return { success: true };

    const currentStorageUsed = usage.storageUsed || 0;
    const newStorageUsed = Math.max(0, currentStorageUsed - fileSizeBytes);

    await ctx.db.patch(usage._id, {
      storageUsed: newStorageUsed,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      storageUsed: newStorageUsed,
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