import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { getAISlashMenuItems } from "@blocknote/xl-ai";
import { EmbedProvider, EditorInstance } from "@/lib/editor/types";
import Image from "next/image";
import { AudioWaveform } from 'lucide-react';

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
      icon: <AudioWaveform />,
    },
  ];

  const embedItems: DefaultReactSuggestionItem[] = [
    {
      title: "YouTube",
      subtext: "Insert video YouTube",
      group: "Embeds",
      aliases: ["youtube", "video", "embed"],
      onItemClick: () => openEmbedModal("youtube"),
      icon: <Image src="/third-party-logo/youtube.svg" alt="YouTube" width={18} height={18} />,
    },
    {
      title: "Google Drive",
      subtext: "Insert file hoặc document from Drive",
      group: "Embeds",
      aliases: ["drive", "google drive", "embed"],
      onItemClick: () => openEmbedModal("drive"),
      icon: <Image src="/third-party-logo/drive.svg" alt="Google Drive" width={18} height={18} />,
    },
    {
      title: "Figma",
      subtext: "Insert file Figma",
      group: "Embeds",
      aliases: ["figma", "design", "embed"],
      onItemClick: () => openEmbedModal("figma"),
      icon: <Image src="/third-party-logo/figma.svg" alt="Figma" width={18} height={18} />,
    },
  ];

  return [...speechItems, ...embedItems, ...getAISlashMenuItems(editor as any)];
};
