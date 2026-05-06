import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx, mutation, query } from "./_generated/server";

const ensureAuthorizedCommentAccess = async (
  ctx: QueryCtx | MutationCtx,
  documentId: Id<"documents">,
) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  const userId = identity.subject;
  const document = await ctx.db.get(documentId);

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return { document, userId };
};

export const getByDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    await ensureAuthorizedCommentAccess(ctx, args.documentId);

    return await ctx.db
      .query("documentComments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    documentId: v.id("documents"),
    blockId: v.string(),
    blockType: v.optional(v.string()),
    selectedText: v.optional(v.string()),
    fallbackText: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await ensureAuthorizedCommentAccess(ctx, args.documentId);

    const now = Date.now();

    const commentId = await ctx.db.insert("documentComments", {
      documentId: args.documentId,
      userId,
      blockId: args.blockId,
      blockType: args.blockType,
      selectedText: args.selectedText,
      fallbackText: args.fallbackText,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.documentId, {
      updatedAt: now,
    });

    return commentId;
  },
});

export const update = mutation({
  args: {
    commentId: v.id("documentComments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("Comment not found");
    }

    const { document } = await ensureAuthorizedCommentAccess(ctx, comment.documentId);

    if (comment.userId !== userId || document.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: now,
    });

    await ctx.db.patch(comment.documentId, {
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: {
    commentId: v.id("documentComments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("Comment not found");
    }

    const { document } = await ensureAuthorizedCommentAccess(ctx, comment.documentId);

    if (comment.userId !== userId || document.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    await ctx.db.delete(args.commentId);
    await ctx.db.patch(comment.documentId, {
      updatedAt: now,
    });
  },
});
