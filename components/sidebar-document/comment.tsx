"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentCommentItem {
  id: string;
  number: number;
  blockId: string;
  blockType?: string;
  selectedText: string;
  fallbackText: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface DocumentSidebarCommentProps {
  comments: DocumentCommentItem[];
  activeCommentId: string | null;
  editingCommentId: string | null;
  editingContent: string;
  savingComment: boolean;
  deletingCommentId: string | null;
  onSelectComment: (commentId: string) => void;
  onStartEdit: (comment: DocumentCommentItem) => void;
  onEditContentChange: (value: string) => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onDeleteComment: (commentId: string) => void;
}

export function DocumentSidebarComment({
  comments,
  activeCommentId,
  editingCommentId,
  editingContent,
  savingComment,
  deletingCommentId,
  onSelectComment,
  onStartEdit,
  onEditContentChange,
  onConfirmEdit,
  onCancelEdit,
  onDeleteComment,
}: DocumentSidebarCommentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">Comments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {comments.length} comment{comments.length === 1 ? "" : "s"} in this note
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {comments.length > 0 ? (
            comments.map((comment) => {
              const isActive = comment.id === activeCommentId;
              const isEditing = comment.id === editingCommentId;
              const isDeleting = comment.id === deletingCommentId;

              return (
                <div
                  key={comment.id}
                  className={`rounded-2xl border p-3 transition ${
                    isActive
                      ? "border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
                      : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectComment(comment.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-amber-300 bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-900">
                        {comment.number}
                      </span>
                      <p className="line-clamp-1 text-sm font-medium">
                        {comment.selectedText || comment.fallbackText || "Comment"}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(comment.updatedAt || comment.createdAt).toLocaleString()}
                    </p>
                  </button>

                  {isEditing ? (
                    <div className="mt-3">
                      <textarea
                        value={editingContent}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          onEditContentChange(e.target.value)
                        }
                        placeholder="Update your comment..."
                        className="min-h-[110px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
                      />
                      <div className="mt-3 flex gap-2">
                        <Button
                          onClick={onConfirmEdit}
                          disabled={savingComment || !editingContent.trim()}
                        >
                          {savingComment ? "Saving..." : "Confirm"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={onCancelEdit}
                          disabled={savingComment}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{comment.content}</p>
                  )}

                  {isActive && !isEditing ? (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStartEdit(comment)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteComment(comment.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  ) : null}
                </div>
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
