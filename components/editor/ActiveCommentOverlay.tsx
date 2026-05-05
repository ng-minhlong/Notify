"use client";

import { RefObject, useEffect, useState } from "react";
import { ActiveEditorComment, EditorInstance } from "@/lib/editor/types";

type ActiveCommentOverlayProps = {
  wrapperRef: RefObject<HTMLDivElement | null>;
  editor: EditorInstance;
  activeComment?: ActiveEditorComment | null;
};

type HighlightRect = {
  key: string;
  top: number;
  left: number;
  width: number;
  height: number;
};

type TextNodeEntry = {
  node: Text;
  start: number;
  end: number;
};

const collectTextNodes = (root: HTMLElement) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const entries: TextNodeEntry[] = [];
  let currentOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const value = node.textContent ?? "";
    if (!value) continue;

    entries.push({
      node,
      start: currentOffset,
      end: currentOffset + value.length,
    });
    currentOffset += value.length;
  }

  return {
    entries,
    fullText: entries.map((entry) => entry.node.textContent ?? "").join(""),
  };
};

const findRangeForText = (blockElement: HTMLElement, selectedText: string) => {
  if (!selectedText) return null;

  const { entries, fullText } = collectTextNodes(blockElement);
  const startIndex = fullText.indexOf(selectedText);

  if (startIndex < 0) return null;

  const endIndex = startIndex + selectedText.length;
  const startEntry = entries.find(
    (entry) => startIndex >= entry.start && startIndex <= entry.end,
  );
  const endEntry = entries.find(
    (entry) => endIndex >= entry.start && endIndex <= entry.end,
  );

  if (!startEntry || !endEntry) return null;

  const range = document.createRange();
  range.setStart(startEntry.node, startIndex - startEntry.start);
  range.setEnd(endEntry.node, endIndex - endEntry.start);
  return range;
};

export const ActiveCommentOverlay = ({
  wrapperRef,
  editor,
  activeComment,
}: ActiveCommentOverlayProps) => {
  const [rects, setRects] = useState<HighlightRect[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !activeComment?.blockId) {
      setRects([]);
      return;
    }

    const measure = () => {
      const currentWrapper = wrapperRef.current;
      if (!currentWrapper || !activeComment.blockId) return;

      const wrapperRect = currentWrapper.getBoundingClientRect();
      const blockElement =
        currentWrapper.querySelector<HTMLElement>(
          `[data-node-type='blockContainer'][data-id='${activeComment.blockId}']`,
        ) ?? currentWrapper.querySelector<HTMLElement>(`[data-id='${activeComment.blockId}']`);

      if (!blockElement) {
        setRects([]);
        return;
      }

      const range = findRangeForText(blockElement, activeComment.selectedText);
      const nextRects =
        range && range.getClientRects().length > 0
          ? Array.from(range.getClientRects()).map((rect, index) => ({
              key: `${activeComment.id}-${index}`,
              top: rect.top - wrapperRect.top - 2,
              left: rect.left - wrapperRect.left - 2,
              width: rect.width + 4,
              height: rect.height + 4,
            }))
          : (() => {
              const blockRect = blockElement.getBoundingClientRect();
              return [
                {
                  key: `${activeComment.id}-block`,
                  top: blockRect.top - wrapperRect.top + 2,
                  left: blockRect.left - wrapperRect.left + 2,
                  width: Math.max(0, blockRect.width - 4),
                  height: Math.max(24, blockRect.height - 4),
                },
              ];
            })();

      setRects(nextRects);
    };

    const scheduleMeasure = () => window.requestAnimationFrame(measure);
    scheduleMeasure();

    const unsubscribe = editor.onChange(() => {
      scheduleMeasure();
    });

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
  }, [activeComment, editor, wrapperRef]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !activeComment?.blockId) return;

    const blockElement =
      wrapper.querySelector<HTMLElement>(
        `[data-node-type='blockContainer'][data-id='${activeComment.blockId}']`,
      ) ?? wrapper.querySelector<HTMLElement>(`[data-id='${activeComment.blockId}']`);

    if (!blockElement) return;

    const range = findRangeForText(blockElement, activeComment.selectedText);
    const rangeElement =
      range?.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range?.startContainer as HTMLElement | null);

    (rangeElement ?? blockElement).scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [activeComment, wrapperRef]);

  if (rects.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
      {rects.map((rect) => (
        <div
          key={rect.key}
          className="absolute rounded-md bg-amber-200/70 ring-1 ring-amber-400/70"
          style={{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
        />
      ))}
    </div>
  );
};
