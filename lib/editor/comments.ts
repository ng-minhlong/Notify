import { toast } from "sonner";
import { CommentRequestDetail, GenericEditorBlock } from "@/lib/editor/types";

export const COMMENT_EVENT_NAME = "notify-editor-comment";

const truncateCommentPreview = (value: string, maxLength = 80) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
};

const extractPlainText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) {
    return value
      .map((item) => extractPlainText(item))
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return [
      extractPlainText(record.text),
      extractPlainText(record.content),
      extractPlainText(record.children),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  return "";
};

export const getBlockCommentContext = (block?: GenericEditorBlock) => {
  if (!block) return "";

  const blockProps = block.props as Record<string, unknown>;

  return (
    extractPlainText(block.content) ||
    extractPlainText(blockProps.transcript) ||
    extractPlainText(blockProps.summary) ||
    extractPlainText(blockProps.url) ||
    extractPlainText(blockProps.embedUrl) ||
    extractPlainText(blockProps.title) ||
    extractPlainText(blockProps.name) ||
    block.type ||
    ""
  );
};

export const emitCommentRequest = (
  detail: Omit<CommentRequestDetail, "summaryText">,
) => {
  const selectedText = detail.selectedText.trim();
  const fallbackText = detail.fallbackText.trim();
  const summaryText = selectedText || fallbackText;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<CommentRequestDetail>(COMMENT_EVENT_NAME, {
        detail: {
          ...detail,
          selectedText,
          fallbackText,
          summaryText,
        },
      }),
    );
  }

  toast.info("Comment action is ready", {
    description: summaryText
      ? truncateCommentPreview(summaryText)
      : "Da mo action Comment cho block hien tai.",
  });
};
