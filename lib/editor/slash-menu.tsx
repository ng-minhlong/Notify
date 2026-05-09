import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { EmbedProvider, EditorInstance } from "@/lib/editor/types";

export const insertSpeechBlock = (editor: EditorInstance) => {
  const speechBlockId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `speech-${Date.now()}`;

  insertOrUpdateBlockForSlashMenu(editor, {
    id: speechBlockId,
    type: "speech",
    props: {
      transcript: "",
      summary: "",
      status: "idle",
      errorMessage: "",
      durationMs: "0",
    },
  });
};

export const getCustomSlashMenuItems = (
  editor: EditorInstance,
  openEmbedModal: (provider: EmbedProvider) => void,
): DefaultReactSuggestionItem[] => {
  const speechItems: DefaultReactSuggestionItem[] = [
    {
      title: "Speech to Text",
      subtext: "Record giọng nói và tự chèn transcript",
      group: "Input",
      aliases: ["speech", "voice", "record", "audio", "transcribe", "dictation"],
      onItemClick: () => insertSpeechBlock(editor),
      icon: <span className="text-base">🎤</span>,
    },
  ];

  const embedItems: DefaultReactSuggestionItem[] = [
    {
      title: "YouTube",
      subtext: "Insert video YouTube",
      group: "Embeds",
      aliases: ["youtube", "video", "embed"],
      onItemClick: () => openEmbedModal("youtube"),
      icon: <span className="text-base">▶</span>,
    },
    {
      title: "Google Drive",
      subtext: "Insert file hoặc document from Drive",
      group: "Embeds",
      aliases: ["drive", "google drive", "embed"],
      onItemClick: () => openEmbedModal("drive"),
      icon: <span className="text-base">📁</span>,
    },
    {
      title: "Figma",
      subtext: "Insert file Figma",
      group: "Embeds",
      aliases: ["figma", "design", "embed"],
      onItemClick: () => openEmbedModal("figma"),
      icon: <span className="text-base">🎨</span>,
    },
  ];

  return [...speechItems, ...embedItems];
};
