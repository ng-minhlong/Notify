"use client";

import { RefObject, useEffect, useState } from "react";
import {
  EditorCommentMarker,
  EditorInstance,
  PositionedCommentMarker,
} from "@/lib/editor/types";

type CommentMarkerOverlayProps = {
  wrapperRef: RefObject<HTMLDivElement | null>;
  editor: EditorInstance;
  comments: EditorCommentMarker[];
  activeCommentId?: string | null;
  onCommentBadgeClick?: (commentId: string) => void;
};

export const CommentMarkerOverlay = ({
  wrapperRef,
  editor,
  comments,
  activeCommentId,
  onCommentBadgeClick,
}: CommentMarkerOverlayProps) => {
  const [positions, setPositions] = useState<PositionedCommentMarker[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || comments.length === 0) {
      setPositions([]);
      return;
    }

    const measure = () => {
      const currentWrapper = wrapperRef.current;
      if (!currentWrapper) return;

      const wrapperRect = currentWrapper.getBoundingClientRect();
      const grouped = new Map<string, EditorCommentMarker[]>();

      comments.forEach((comment) => {
        const existing = grouped.get(comment.blockId) ?? [];
        existing.push(comment);
        grouped.set(comment.blockId, existing);
      });

      const nextPositions: PositionedCommentMarker[] = [];

      grouped.forEach((blockComments, blockId) => {
        const target =
          currentWrapper.querySelector<HTMLElement>(
            `[data-node-type='blockContainer'][data-id='${blockId}']`,
          ) ??
          currentWrapper.querySelector<HTMLElement>(`[data-id='${blockId}']`);

        if (!target) return;

        const blockRect = target.getBoundingClientRect();

        blockComments.forEach((comment, index) => {
          nextPositions.push({
            ...comment,
            top: blockRect.top - wrapperRect.top - 10,
            left: blockRect.left - wrapperRect.left + 18 + index * 34,
          });
        });
      });

      setPositions(nextPositions);
    };

    const scheduleMeasure = () => {
      window.requestAnimationFrame(measure);
    };

    scheduleMeasure();

    const unsubscribe =
      editor.onChange(() => {
        scheduleMeasure();
      }) ?? null;

    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, true);

    const observer = new MutationObserver(scheduleMeasure);
    observer.observe(wrapper, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      unsubscribe?.();
      observer.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure, true);
    };
  }, [comments, editor, wrapperRef]);

  if (positions.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {positions.map((comment) => (
        <button
          key={comment.id}
          type="button"
          className={`pointer-events-auto absolute inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-1.5 text-[11px] font-semibold shadow-sm transition ${
            comment.id === activeCommentId
              ? "border-amber-500 bg-amber-300 text-amber-950"
              : "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
          }`}
          style={{
            top: `${comment.top}px`,
            left: `${comment.left}px`,
          }}
          onClick={() => onCommentBadgeClick?.(comment.id)}
          title={`Comment ${comment.number}`}
        >
          {comment.number}
        </button>
      ))}
    </div>
  );
};
