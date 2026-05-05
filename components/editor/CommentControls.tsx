"use client";

import { ReactNode } from "react";
import { SideMenuExtension } from "@blocknote/core/extensions";
import {
  BlockColorsItem,
  DragHandleMenu,
  FormattingToolbar,
  RemoveBlockItem,
  TableColumnHeaderItem,
  TableRowHeaderItem,
  getFormattingToolbarItems,
  useBlockNoteEditor,
  useComponentsContext,
  useExtensionState,
} from "@blocknote/react";
import { MessageSquarePlus } from "lucide-react";
import { emitCommentRequest, getBlockCommentContext } from "@/lib/editor/comments";

const SelectionCommentButton = () => {
  const editor = useBlockNoteEditor();
  const components = useComponentsContext();

  if (!components) return null;

  return (
    <components.Generic.Toolbar.Button
      mainTooltip="Comment"
      onClick={() => {
        const selectedText = window.getSelection()?.toString() ?? "";
        const currentBlock = editor.getTextCursorPosition().block;

        emitCommentRequest({
          source: "selection",
          blockId: currentBlock?.id,
          blockType: currentBlock?.type,
          selectedText,
          fallbackText: getBlockCommentContext(currentBlock),
        });
      }}
    >
      <MessageSquarePlus className="h-4 w-4" />
    </components.Generic.Toolbar.Button>
  );
};

const BlockCommentItem = ({ children }: { children: ReactNode }) => {
  const components = useComponentsContext();
  const block = useExtensionState(SideMenuExtension, {
    selector: (state) => state?.block,
  });

  if (!components || !block) return null;

  return (
    <components.Generic.Menu.Item
      icon={<MessageSquarePlus className="h-4 w-4" />}
      onClick={() => {
        emitCommentRequest({
          source: "block",
          blockId: block.id,
          blockType: block.type,
          selectedText: "",
          fallbackText: getBlockCommentContext(block),
        });
      }}
    >
      {children}
    </components.Generic.Menu.Item>
  );
};

export const EditorFormattingToolbar = () => (
  <FormattingToolbar>
    {getFormattingToolbarItems()}
    <SelectionCommentButton key="comment-button" />
  </FormattingToolbar>
);

export const EditorDragHandleMenu = () => (
  <DragHandleMenu>
    <RemoveBlockItem>Delete</RemoveBlockItem>
    <BlockColorsItem>Colors</BlockColorsItem>
    <TableRowHeaderItem>Row Header</TableRowHeaderItem>
    <TableColumnHeaderItem>Column Header</TableColumnHeaderItem>
    <BlockCommentItem>Comment</BlockCommentItem>
  </DragHandleMenu>
);
