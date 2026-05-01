import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    parentDocument: v.optional(v.id("documents")),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    summaryHistory: v.optional(v.string()),
    mindmapHistory: v.optional(v.string()),
    qAHistory: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.boolean(),
    order: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    isFavorite: v.optional(v.boolean()),
    editorFont: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentDocument"]),

  userSettings: defineTable({
    userId: v.string(),
    editorFont: v.optional(v.string()),
    focusMode: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  userPlan: defineTable({
    userId: v.string(),

    // 🔥 trạng thái app dùng
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro")
    ),

    // 🔥 status logic (không phụ thuộc Paddle hoàn toàn)
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trial")
    ),

    // 🔥 mapping với Paddle
    paddleCustomerId: v.optional(v.string()),
    paddleSubscriptionId: v.optional(v.string()),

    // 🔥 billing time
    currentPeriodEnd: v.optional(v.number()),

    // 🔥 optional nhưng rất hữu ích
    trialEndsAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),



  userUsage: defineTable({
    userId: v.string(),

    // STORAGE
    storageUsed: v.number(),
    // AI USAGE
    aiHourlyUsed: v.number(),
    aiHourlyResetAt: v.number(),
    aiDailyUsed: v.number(),
    aiDailyResetAt: v.number(),
    aiWeeklyUsed: v.number(),
    aiWeeklyResetAt: v.number(),
    aiMonthlyUsed: v.number(),
    aiMonthlyResetAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),



  userCredits: defineTable({
    userId: v.string(),

    // plan của user
    plan: v.union(
      v.literal("free"),
      v.literal("pro")
    ),

    // số lần đã dùng trong ngày
    used: v.number(),

    // ngày cuối cùng sử dụng (YYYY-MM-DD)
    lastUsedDate: v.string(),
  }).index("by_user", ["userId"]),


customers: defineTable({
  customerId: v.string(), // paddle_customer_id
  email: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_customer_id", ["customerId"])
  .index("by_email", ["email"]),

subscriptions: defineTable({
  subscriptionId: v.string(), // paddle_subscription_id
  status: v.string(), // active, canceled, past_due...

  priceId: v.optional(v.string()),
  productId: v.optional(v.string()),

  scheduledChange: v.optional(v.string()),

  customerId: v.string(), // link thủ công

  currentPeriodEnd: v.optional(v.number()),

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_subscription_id", ["subscriptionId"])
  .index("by_customer_id", ["customerId"]),

calendarNotes: defineTable({
  userId: v.string(),
  date: v.string(), // YYYY-MM-DD format
  title: v.string(),
  description: v.optional(v.string()),
  timeType: v.union(v.literal("all_day"), v.literal("specific_time")),
  startTime: v.optional(v.string()), // HH:mm format
  endTime: v.optional(v.string()), // HH:mm format
  color: v.optional(v.string()),
  isArchived: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_date", ["userId", "date"])
  .index("by_user_archived", ["userId", "isArchived"]),
});