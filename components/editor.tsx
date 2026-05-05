"use client";

import { filterSuggestionItems } from "@blocknote/core/extensions";
import {
  FormattingToolbarController,
  SideMenu,
  SideMenuController,
  SuggestionMenuController,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "next-themes";
import { ActiveCommentOverlay } from "@/components/editor/ActiveCommentOverlay";
import { CommentMarkerOverlay } from "@/components/editor/CommentMarkerOverlay";
import {
  EditorDragHandleMenu,
  EditorFormattingToolbar,
} from "@/components/editor/CommentControls";
import { EmbedModal } from "@/components/editor/EmbedModal";
import { InlineCommentComposer } from "@/components/editor/InlineCommentComposer";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { EditorProps } from "@/lib/editor/types";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";

const Editor = ({
  comments = [],
  onCommentBadgeClick,
  pendingComment,
  pendingCommentContent,
  savingComment,
  onPendingCommentChange,
  onPendingCommentSave,
  onPendingCommentCancel,
  activeComment,
  ...props
}: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const {
    closeEmbedModal,
    customSlashMenuItems,
    editor,
    editorStyle,
    embedDialogOpen,
    embedError,
    embedInputUrl,
    embedProvider,
    handleCapture,
    handleEditorChange,
    handleMouseDown,
    insertEmbedBlock,
    setEmbedInputUrl,
    viewEditable,
    wrapperRef,
  } = useEditorLogic(props);

  return (
    <div
      ref={wrapperRef}
      className="relative flex-1 shrink-0 pb-10"
      style={editorStyle}
      onDropCapture={handleCapture}
      onDragOverCapture={handleCapture}
      onMouseDown={handleMouseDown}
    >
      <BlockNoteView
        editable={viewEditable}
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={handleEditorChange}
        className="wrap-break-word"
        slashMenu={false}
        formattingToolbar={false}
        sideMenu={false}
      >
        <FormattingToolbarController formattingToolbar={EditorFormattingToolbar} />
        <SideMenuController
          sideMenu={(sideMenuProps) => (
            <SideMenu {...sideMenuProps} dragHandleMenu={EditorDragHandleMenu} />
          )}
        />
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(customSlashMenuItems, query)
          }
        />
      </BlockNoteView>

      <CommentMarkerOverlay
        wrapperRef={wrapperRef}
        editor={editor}
        comments={comments}
        activeCommentId={activeComment?.id ?? null}
        onCommentBadgeClick={onCommentBadgeClick}
      />
      <ActiveCommentOverlay
        wrapperRef={wrapperRef}
        editor={editor}
        activeComment={activeComment}
      />
      <InlineCommentComposer
        wrapperRef={wrapperRef}
        pendingComment={pendingComment}
        content={pendingCommentContent}
        saving={savingComment}
        onChange={onPendingCommentChange}
        onSave={onPendingCommentSave}
        onCancel={onPendingCommentCancel}
      />

      <EmbedModal
        open={embedDialogOpen}
        provider={embedProvider}
        value={embedInputUrl}
        error={embedError}
        onChange={setEmbedInputUrl}
        onClose={closeEmbedModal}
        onSubmit={insertEmbedBlock}
      />
    </div>
  );
};

export default Editor;
