"use client";

import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentDraft {
  blockId?: string;
  blockType?: string;
  selectedText: string;
  fallbackText: string;
  summaryText: string;
}

interface DocumentCommentItem {
  id: string;
  number: number;
  blockId: string;
  blockType?: string;
  selectedText: string;
  fallbackText: string;
  content: string;
  createdAt: number;
}

interface DocumentSidebarCommentProps {
  comments: DocumentCommentItem[];
  selectedCommentId: string | null;
  onSelectComment: (commentId: string) => void;
  pendingComment: CommentDraft | null;
  newCommentContent: string;
  setNewCommentContent: (value: string) => void;
  savingComment: boolean;
  onSaveComment: () => void;
  onCancelDraft: () => void;
}

export function DocumentSidebarComment({
  comments,
  selectedCommentId,
  onSelectComment,
  pendingComment,
  newCommentContent,
  setNewCommentContent,
  savingComment,
  onSaveComment,
  onCancelDraft,
}: DocumentSidebarCommentProps) {
  const selectedComment =
    comments.find((comment) => comment.id === selectedCommentId) ?? comments[0] ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">Comments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {comments.length} comment{comments.length === 1 ? "" : "s"} in this note
        </p>
      </div>

      {pendingComment ? (
        <div className="border-b border-border p-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
              <MessageSquarePlus className="h-4 w-4" />
              New comment
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-100">
              {pendingComment.summaryText || "Current block"}
            </p>
            <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-200/80">
              Block: {pendingComment.blockType || "unknown"}
            </p>
          </div>

          <textarea
            value={newCommentContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNewCommentContent(e.target.value)
            }
            placeholder="Write your comment..."
            className="mt-3 min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-ring"
          />

          <div className="mt-3 flex gap-2">
            <Button
              onClick={onSaveComment}
              disabled={savingComment || !newCommentContent.trim()}
            >
              {savingComment ? "Saving..." : "Save Comment"}
            </Button>
            <Button variant="outline" onClick={onCancelDraft} disabled={savingComment}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {selectedComment ? (
        <div className="border-b border-border p-4">
          <div className="mb-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-amber-300 bg-amber-100 px-2 text-xs font-semibold text-amber-900">
            {selectedComment.number}
          </div>
          <p className="text-sm font-medium text-foreground">
            {selectedComment.selectedText || selectedComment.fallbackText || "Comment"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(selectedComment.createdAt).toLocaleString()}
          </p>
          <div className="mt-3 rounded-2xl border border-border bg-muted/40 p-3 text-sm leading-6 text-foreground">
            {selectedComment.content}
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {comments.length > 0 ? (
            comments.map((comment) => {
              const isActive = comment.id === (selectedCommentId ?? selectedComment?.id);

              return (
                <button
                  key={comment.id}
                  type="button"
                  onClick={() => onSelectComment(comment.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? "border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-amber-300 bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-900">
                      {comment.number}
                    </span>
                    <p className="line-clamp-1 text-sm font-medium">
                      {comment.selectedText || comment.fallbackText || "Comment"}
                    </p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {comment.content}
                  </p>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              No comments yet. Select text or open the block menu and choose Comment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
