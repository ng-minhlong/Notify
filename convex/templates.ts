import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const archive = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const exisingTemplate = await ctx.db.get(args.id);

    if (!exisingTemplate) {
      throw new Error("Template not found");
    }

    if (exisingTemplate.userId !== userId) {
      throw new Error("Not authorized");
    }

    const recursiveArchive = async (templateId: Id<"templates">) => {
      const children = await ctx.db
        .query("templates")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentTemplate", templateId),
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: true,
        });

        await recursiveArchive(child._id);
      }
    };

    const template = await ctx.db.patch(args.id, {
      isArchived: true,
    });

    recursiveArchive(args.id);

    return template;
  },
});


export const create = mutation({
  args: {
    title: v.string(),
    parentTemplate: v.optional(v.id("templates")),
    categoryId: v.optional(v.id("categories_template")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const template = await ctx.db.insert("templates", {
      title: args.title,
      parentTemplate: args.parentTemplate,
      categoryId: args.categoryId,
      userId,
      isArchived: false,
      isPublished: false,
      isPublic: false,
    });

    return template;
  },
});

export const getPublicTemplates = query({
  args: {
    categoryId: v.optional(v.id("categories_template")),
  },
  handler: async (ctx, args) => {
    const templates = args.categoryId
      ? await ctx.db
          .query("templates")
          .withIndex("by_public_category", (q) =>
            q.eq("isPublic", true).eq("categoryId", args.categoryId),
          )
          .filter((q) => q.eq(q.field("isArchived"), false))
          .order("desc")
          .collect()
      : await ctx.db
          .query("templates")
          .withIndex("by_public", (q) => q.eq("isPublic", true))
          .filter((q) => q.eq(q.field("isArchived"), false))
          .order("desc")
          .collect();

    return templates;
  },
});

export const getTrash = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return templates;
  },
});

export const restore = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const exisingTemplate = await ctx.db.get(args.id);

    if (!exisingTemplate) {
      throw new Error("Template not found");
    }

    if (exisingTemplate.userId !== userId) {
      throw new Error("Not authorized");
    }

    const recursiveRestore = async (templateId: Id<"templates">) => {
      const children = await ctx.db
        .query("templates")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentTemplate", templateId),
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: false,
        });

        await recursiveRestore(child._id);
      }
    };

    const options: Partial<Doc<"templates">> = {
      isArchived: false,
    };

    if (exisingTemplate.parentTemplate) {
      const parent = await ctx.db.get(exisingTemplate.parentTemplate);

      if (parent?.isArchived) {
        options.parentTemplate = undefined;
      }
    }

    const template = await ctx.db.patch(args.id, options);

    recursiveRestore(args.id);

    return template;
  },
});

export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const exisingTemplate = await ctx.db.get(args.id);

    if (!exisingTemplate) {
      throw new Error("Template not found");
    }

    if (exisingTemplate.userId !== userId) {
      throw new Error("Not authorized");
    }

    const template = await ctx.db.delete(args.id);

    return template;
  },
});

export const getSearch = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return templates;
  },
});

export const getByUserId = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (identity.subject !== args.userId) {
      throw new Error("Unauthorized");
    }

    const templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return templates;
  },
});

export const getById = query({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const template = await ctx.db.get(args.templateId);

    if (!template) {
      throw new Error("Template not found");
    }

    if (template.isPublic && !template.isArchived) {
      return template;
    }

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    if (template.userId !== userId) {
      throw new Error("Not authorized");
    }

    return template;
  },
});





export const update = mutation({
  args: {
    id: v.id("templates"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    categoryId: v.optional(v.id("categories_template")),
    editorFont: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const { id, ...rest } = args;

    const existingTemplate = await ctx.db.get(args.id);

    if (!existingTemplate) {
      throw new Error("Template not found");
    }

    if (existingTemplate.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const template = await ctx.db.patch(args.id, {
      ...rest,
      updatedAt: Date.now(),
    });

    return template;
  },
});

export const removeIcon = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingTemplate = await ctx.db.get(args.id);

    if (!existingTemplate) {
      throw new Error("Template not found");
    }

    if (existingTemplate.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const template = await ctx.db.patch(args.id, {
      icon: undefined,
      updatedAt: Date.now(),
    });

    return template;
  },
});

export const removeCoverImage = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingTemplate = await ctx.db.get(args.id);

    if (!existingTemplate) {
      throw new Error("Template not found");
    }

    if (existingTemplate.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const template = await ctx.db.patch(args.id, {
      coverImage: undefined,
      updatedAt: Date.now(),
    });

    return template;
  },
});

export const reorder = mutation({
  args: {
    id: v.id("templates"),
    parentTemplate: v.optional(v.id("templates")),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const siblings = await ctx.db
      .query("templates")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userId).eq("parentTemplate", args.parentTemplate),
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    siblings.sort((a, b) => {
      if (a.order === undefined && b.order === undefined) return 0;
      if (a.order === undefined) return -1;
      if (b.order === undefined) return 1;
      return a.order - b.order;
    });

    const itemIndex = siblings.findIndex((sibling) => sibling._id === args.id);
    const [movedItem] = siblings.splice(itemIndex, 1);
    siblings.splice(args.newOrder, 0, movedItem);

    await Promise.all(
      siblings.map((sibling, index) =>
        ctx.db.patch(sibling._id, {
          order: index,
        }),
      ),
    );

    return true;
  },
});

export const removeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .collect();

    const promises = templates.map((template) => ctx.db.delete(template._id));
    await Promise.all(promises);
    return true;
  },
});

export const toggleFavorite = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingTemplate = await ctx.db.get(args.id);

    if (!existingTemplate) {
      throw new Error("Template");
    }

    if (existingTemplate.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const template = await ctx.db.patch(args.id, {
      isFavorite: !existingTemplate.isFavorite,
    });

    return template;
  },
});

export const getFavorites = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isFavorite"), true),
          q.eq(q.field("isArchived"), false),
        ),
      )
      .order("desc")
      .collect();

    return templates;
  },
});

export const applyTemplate = mutation({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const template = await ctx.db.get(args.templateId);

    if (!template) {
      throw new Error("Template not found");
    }

    // Check if template is public or owned by user
    if (!template.isPublic && template.userId !== userId) {
      throw new Error("Not authorized to apply this template");
    }

    // Create new document based on template
    const documentId = await ctx.db.insert("documents", {
      title: template.title,
      content: template.content,
      userId,
      isArchived: false,
      isPublished: false,
    });

    return documentId;
  },
});