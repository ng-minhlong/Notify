import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSubscriptionBySubscriptionId = query({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_subscription_id", (q) =>
        q.eq("subscriptionId", args.subscriptionId)
      )
      .first();
  },
});

export const getSubscriptionByCustomerId = query({
  args: {
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .first();
  },
});

export const upsertSubscriptionFromWebhook = mutation({
  args: {
    subscriptionId: v.string(),
    customerId: v.string(),
    status: v.string(),
    priceId: v.optional(v.string()),
    productId: v.optional(v.string()),
    scheduledChange: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscription_id", (q) =>
        q.eq("subscriptionId", args.subscriptionId)
      )
      .first();

    const now = Date.now();

    const doc = {
      subscriptionId: args.subscriptionId,
      status: args.status,
      priceId: args.priceId,
      productId: args.productId,
      scheduledChange: args.scheduledChange,
      customerId: args.customerId,
      currentPeriodEnd: args.currentPeriodEnd,
      createdAt: now,
      updatedAt: now,
      ...(args.userId ? { userId: args.userId } : {}),
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...doc,
        createdAt: existing.createdAt,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("subscriptions", doc);
  },
});