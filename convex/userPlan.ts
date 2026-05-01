import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

//
// ✅ GET USER PLAN (read only)
//
export const getUserPlan = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const plan = await ctx.db
      .query("userPlan")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return plan;
  },
});

//
// ✅ LAZY CREATE (your idea but clean)
//
export const getOrCreateUserPlan = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existing = await ctx.db
      .query("userPlan")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) return existing;

    const now = Date.now();

    const id = await ctx.db.insert("userPlan", {
      userId,
      plan: "free",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

//
// ✅ UPDATE FROM PADDLE WEBHOOK
// ⚠️ webhook thường không có auth → giữ userId arg
//
export const updateUserPlanFromWebhook = mutation({
  args: {
    userId: v.string(),

    plan: v.union(
      v.literal("starter"),
      v.literal("pro")
    ),

    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due")
    ),

    paddleCustomerId: v.optional(v.string()),
    paddleSubscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPlan")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
    } else {
      // 🔥 cực kỳ quan trọng: handle webhook đến trước user login
      await ctx.db.insert("userPlan", {
        ...args,
        createdAt: now,
        updatedAt: now,
        });
    }
  },
});