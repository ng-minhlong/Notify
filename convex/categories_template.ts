import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    parentCategory: v.optional(v.id("categories_template")),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const categoryId = await ctx.db.insert("categories_template", {
      name: args.name.trim(),
      parentCategory: args.parentCategory,
      order: args.order,
    });

    return categoryId;
  },
});

export const update = mutation({
  args: {
    id: v.id("categories_template"),
    name: v.optional(v.string()),
    parentCategory: v.optional(v.id("categories_template")),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const { id, ...rest } = args;

    const existing = await ctx.db.get(id);

    if (!existing) {
      throw new Error("Category not found");
    }

    const category = await ctx.db.patch(id, {
      ...rest,
      ...(rest.name ? { name: rest.name.trim() } : {}),
    });

    return category;
  },
});

export const get = query({
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories_template").collect();

    return categories.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  },
});