"use client";

import {
  CSSProperties,
  DragEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCoverImage } from "@/hooks/useCoverImage";
import { EditorFont } from "@/hooks/useEditorFont";
import { useEdgeStore } from "@/lib/edgestore";
import {
  EMBED_PROVIDER_META,
  getProviderFromEmbedUrl,
  normalizeEmbedUrl,
} from "@/lib/editor/embed";
import { createEditorSchema } from "@/lib/editor/schema";
import { getCustomSlashMenuItems } from "@/lib/editor/slash-menu";
import {
  EditorInstance,
  EditorProps,
  EmbedProvider,
  TiptapCoordsResult,
} from "@/lib/editor/types";
import { fontFamilies } from "@/lib/editorFont";
import {
  applyMultiColumnSchema,
  createBlockNoteDictionary,
  createSlashMenuItems,
  multiColumnDropCursor,
} from "@/lib/blocknote/multiColumn";

const MIN_SUMMARY_LENGTH = 50;
const MEDIA_BLOCK_TYPES = new Set(["image", "video", "audio", "file"]);

const getMediaUrls = (editor: EditorInstance): Set<string> => {
  const urls = new Set<string>();

  editor.forEachBlock((block) => {
    if (MEDIA_BLOCK_TYPES.has(block.type)) {
      const url = (block.props as Record<string, unknown>).url;
      if (typeof url === "string" && url.trim() !== "") {
        urls.add(url);
      }
    }
    return true;
  });

  return urls;
};

export const useEditorLogic = ({
  onChange,
  initialContent,
  editable = true,
  editorFont,
  onEditorReady,
}: Pick<
  EditorProps,
  "onChange" | "initialContent" | "editable" | "editorFont" | "onEditorReady"
>) => {
  const params = useParams();
  const documentId = params?.documentId as Id<"documents"> | undefined;
  const { edgestore } = useEdgeStore();
  const coverImage = useCoverImage();

  const checkAndConsumeStorage = useMutation(api.userUsage.checkAndConsumeStorage);
  const checkAndConsumeAIUsage = useMutation(api.userUsage.checkAndConsumeAIUsage);
  const addSummaryToHistory = useMutation(api.documents.addSummaryToHistory);
  const freeStorage = useMutation(api.userUsage.freeStorage);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorInstance | null>(null);
  const trackedUrlsRef = useRef<Set<string>>(new Set());
  const fileSizeMapRef = useRef<Map<string, number>>(new Map());

  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [embedProvider, setEmbedProvider] = useState<EmbedProvider>("youtube");
  const [embedInputUrl, setEmbedInputUrl] = useState("");
  const [embedError, setEmbedError] = useState<string | null>(null);

  const openEmbedModal = useCallback((provider: EmbedProvider) => {
    setEmbedProvider(provider);
    setEmbedInputUrl("");
    setEmbedError(null);
    setEmbedDialogOpen(true);
  }, []);

  const closeEmbedModal = useCallback(() => {
    setEmbedDialogOpen(false);
    setEmbedInputUrl("");
    setEmbedError(null);
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        await checkAndConsumeStorage({ fileSizeBytes: file.size });
        const result = await edgestore.publicFiles.upload({ file });
        fileSizeMapRef.current.set(result.url, file.size);
        return result.url;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload file";
        toast.error(message);
        throw error;
      }
    },
    [checkAndConsumeStorage, edgestore.publicFiles],
  );

  const updateSpeechBlockProps = useCallback(
    (blockId: string, props: Record<string, string>) => {
      const currentEditor = editorRef.current;
      if (!currentEditor) return;

      currentEditor.updateBlock(blockId, {
        type: "speech",
        props,
      });
    },
    [],
  );

  const generateSpeechSummary = useCallback(
    async (blockId: string, transcript: string) => {
      const normalizedTranscript = transcript.trim();

      if (normalizedTranscript.length < MIN_SUMMARY_LENGTH) {
        updateSpeechBlockProps(blockId, {
          status: "error",
          errorMessage: `Transcript phải có ít nhất ${MIN_SUMMARY_LENGTH} ký tự để tạo summary.`,
        });
        return;
      }

      try {
        await checkAndConsumeAIUsage({ amount: 1 });

        const response = await fetch("/api/tool/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: normalizedTranscript }),
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => ({
            error: "Unknown error",
          }))) as { error?: string };

          throw new Error(errorPayload.error || "Failed to generate summary");
        }

        const data = (await response.json()) as { summary?: string };
        const nextSummary = (data.summary || "").trim();

        if (!nextSummary) {
          throw new Error("Summary response is empty");
        }

        updateSpeechBlockProps(blockId, {
          summary: nextSummary,
          status: "completed",
          errorMessage: "",
        });

        if (documentId) {
          await addSummaryToHistory({
            id: documentId,
            summary: nextSummary,
          });
        }
      } catch (error) {
        updateSpeechBlockProps(blockId, {
          status: "error",
          errorMessage:
            error instanceof Error ? error.message : "Cannot create summary.",
        });
      }
    },
    [
      addSummaryToHistory,
      checkAndConsumeAIUsage,
      documentId,
      updateSpeechBlockProps,
    ],
  );


  const schema = useMemo(
    () =>
      applyMultiColumnSchema(
        createEditorSchema({
          onSpeechBlockUpdate: updateSpeechBlockProps,
          onGenerateSummary: generateSpeechSummary,
        }),
      ),
    [generateSpeechSummary, updateSpeechBlockProps],
  );


  const editor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleUpload,
    schema,
    dropCursor: multiColumnDropCursor,
    dictionary: createBlockNoteDictionary(),
  });


  useEffect(() => {
    editorRef.current = editor;
    trackedUrlsRef.current = getMediaUrls(editor);
    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  const insertEmbedBlock = useCallback(() => {
    const rawUrl = embedInputUrl.trim();

    if (!rawUrl) {
      setEmbedError("Vui lòng dán link trước khi bấm OK.");
      return;
    }

    let finalProvider = embedProvider;
    const detectedProvider = getProviderFromEmbedUrl(rawUrl);

    if (detectedProvider && detectedProvider !== embedProvider) {
      finalProvider = detectedProvider;
    }

    const embedUrl = normalizeEmbedUrl(finalProvider, rawUrl);
    const currentBlock = editor.getTextCursorPosition().block;

    if (!currentBlock) {
      toast.error("Cannot find current cursor");
      return;
    }

    const spacerId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `embed-spacer-${Date.now()}`;

    editor.insertBlocks(
      [
        {
          type: "embed",
          props: {
            provider: finalProvider,
            url: rawUrl,
            embedUrl,
            title: EMBED_PROVIDER_META[finalProvider].label,
          },
        },
        {
          id: spacerId,
          type: "paragraph",
          content: "",
        },
      ] as any,
      currentBlock,
      "after",
    );

    editor.setTextCursorPosition(spacerId, "start");
    closeEmbedModal();
  }, [closeEmbedModal, editor, embedInputUrl, embedProvider]);

  const handleEditorChange = useCallback(() => {
    const currentUrls = getMediaUrls(editor);
    const removedUrls = [...trackedUrlsRef.current].filter(
      (url) => !currentUrls.has(url),
    );

    removedUrls.forEach((url) => {
      const fileSize = fileSizeMapRef.current.get(url);
      if (fileSize) {
        freeStorage({ fileSizeBytes: fileSize }).catch((error) => {
          console.warn("Failed to free storage for deleted file:", url, error);
        });
        fileSizeMapRef.current.delete(url);
      }

      edgestore.publicFiles.delete({ url }).catch((error) => {
        console.warn("Failed to delete file in edgestore:", url, error);
      });
    });

    trackedUrlsRef.current = currentUrls;
    onChange(JSON.stringify(editor.document, null, 2));
  }, [editor, edgestore.publicFiles, freeStorage, onChange]);

  const handleCapture = useCallback(
    (event: DragEvent) => {
      if (!coverImage.isOpen) return;
      event.preventDefault();
      event.stopPropagation();
    },
    [coverImage.isOpen],
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!editable || coverImage.isOpen) return;

      const blockElement = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-node-type='blockContainer']",
      );
      if (!blockElement) return;

      const blockId = blockElement.getAttribute("data-id");
      if (!blockId) return;

      const previousBlock = editor.getPrevBlock(blockId);
      if (!previousBlock || !MEDIA_BLOCK_TYPES.has(previousBlock.type)) return;

      event.stopPropagation();

      const view = editor._tiptapEditor.view;
      const position = view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      }) as TiptapCoordsResult | null;

      if (position) {
        const selectionConstructor = view.state.selection.constructor as unknown as {
          near: (
            resolvedPos: ReturnType<typeof view.state.doc.resolve>,
          ) => typeof view.state.selection;
        };

        view.dispatch(
          view.state.tr.setSelection(
            selectionConstructor.near(view.state.doc.resolve(position.pos)),
          ),
        );
      }

      editor.focus();
    },
    [coverImage.isOpen, editable, editor],
  );


  const customSlashMenuItems = useMemo(
    () => createSlashMenuItems(editor, getCustomSlashMenuItems(editor, openEmbedModal)),
    [editor, openEmbedModal],
  );

  const editorStyle = useMemo(
    () =>
      ({
        "--editor-font": fontFamilies[editorFont as EditorFont],
      }) as CSSProperties,
    [editorFont],
  );

  return {
    closeEmbedModal,
    commentsDisabled: coverImage.isOpen,
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
    openEmbedModal,
    setEmbedInputUrl: (value: string) => {
      setEmbedInputUrl(value);
      setEmbedError(null);
    },
    viewEditable: editable && !coverImage.isOpen,
    wrapperRef,
  };
};
