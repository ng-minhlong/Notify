import { Block, BlockNoteEditor } from "@blocknote/core";

export type EditorInstance = BlockNoteEditor<any, any, any>;

export interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  editorFont?: string;
  onEditorReady?: (editor: EditorInstance) => void;
  comments?: EditorCommentMarker[];
  onCommentBadgeClick?: (commentId: string) => void;
  pendingComment?: CommentRequestDetail | null;
  pendingCommentContent?: string;
  savingComment?: boolean;
  onPendingCommentChange?: (value: string) => void;
  onPendingCommentSave?: () => void;
  onPendingCommentCancel?: () => void;
  activeComment?: ActiveEditorComment | null;
}

export type EmbedProvider = "youtube" | "drive" | "figma";

export type CommentTriggerSource = "selection" | "block";

export type SpeechBlockStatus =
  | "idle"
  | "recording"
  | "processing"
  | "completed"
  | "error";

export type CommentRequestDetail = {
  source: CommentTriggerSource;
  blockId?: string;
  blockType?: string;
  selectedText: string;
  fallbackText: string;
  summaryText: string;
};

export type ActiveEditorComment = {
  id: string;
  blockId: string;
  selectedText: string;
  fallbackText: string;
};

export type EditorCommentMarker = {
  id: string;
  blockId: string;
  number: number;
};

export type PositionedCommentMarker = EditorCommentMarker & {
  top: number;
  left: number;
};

export type GenericEditorBlock = Block<any, any, any>;

export type TiptapCoordsResult = {
  pos: number;
  inside: number;
};
