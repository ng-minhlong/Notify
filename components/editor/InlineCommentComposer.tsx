"use client";

import { KeyboardEvent, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CommentRequestDetail } from "@/lib/editor/types";

type InlineCommentComposerProps = {
  wrapperRef: RefObject<HTMLDivElement | null>;
  pendingComment: CommentRequestDetail | null | undefined;
  content: string | undefined;
  saving: boolean | undefined;
  onChange?: (value: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
};

type ComposerPosition = {
  top: number;
  left: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const InlineCommentComposer = ({
  wrapperRef,
  pendingComment,
  content = "",
  saving = false,
  onChange,
  onSave,
  onCancel,
}: InlineCommentComposerProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [position, setPosition] = useState<ComposerPosition | null>(null);

  const summaryText = useMemo(
    () => pendingComment?.selectedText || pendingComment?.fallbackText || "",
    [pendingComment],
  );

  useEffect(() => {
    if (!pendingComment?.blockId) {
      setPosition(null);
      return;
    }

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updatePosition = () => {
      const currentWrapper = wrapperRef.current;
      if (!currentWrapper || !pendingComment.blockId) return;

      const wrapperRect = currentWrapper.getBoundingClientRect();
      const blockElement =
        currentWrapper.querySelector<HTMLElement>(
          `[data-node-type='blockContainer'][data-id='${pendingComment.blockId}']`,
        ) ?? currentWrapper.querySelector<HTMLElement>(`[data-id='${pendingComment.blockId}']`);

      if (!blockElement) {
        setPosition(null);
        return;
      }

      const selection = window.getSelection();
      const range =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const selectionInsideWrapper =
        range &&
        !range.collapsed &&
        currentWrapper.contains(range.commonAncestorContainer);

      const targetRect =
        selectionInsideWrapper && pendingComment.selectedText
          ? range.getBoundingClientRect()
          : blockElement.getBoundingClientRect();

      const overlayWidth = 320;
      const nextLeft = clamp(
        targetRect.left - wrapperRect.left + targetRect.width / 2 - overlayWidth / 2,
        12,
        Math.max(12, wrapperRect.width - overlayWidth - 12),
      );

      setPosition({
        top: Math.max(8, targetRect.top - wrapperRect.top - 140),
        left: nextLeft,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [pendingComment, wrapperRef]);

  useEffect(() => {
    if (!pendingComment) return;
    textareaRef.current?.focus();
  }, [pendingComment]);

  if (!pendingComment || !position) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!saving && content.trim()) {
        onSave?.();
      }
    }
  };

  return (
    <div
      className="absolute z-30 w-80 rounded-2xl border border-amber-200 bg-background p-3 shadow-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <p className="line-clamp-2 text-xs font-medium text-amber-700">
        {summaryText || "Current block"}
      </p>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write your comment and press Enter..."
        className="mt-2 min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
      />
      <div className="mt-3 flex gap-2">
        <Button onClick={onSave} disabled={saving || !content.trim()}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
