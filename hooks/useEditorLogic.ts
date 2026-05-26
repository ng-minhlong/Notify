"use client";

import { useUser } from "@clerk/nextjs";

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
import { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { AIExtension } from "@blocknote/xl-ai";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import "@blocknote/xl-ai/style.css";
import { DefaultChatTransport } from "ai";
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
import YPartyKitProvider from "y-partykit/provider";
import * as Y from "yjs";

// Sets up Yjs document and PartyKit Yjs provider.
// NOTE: ydoc/provider are created inside the hook (not module-level) so they
// are recreated whenever documentId changes.


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
  const { user } = useUser();
  const params = useParams();
  const documentId = params?.documentId as Id<"documents"> | undefined;
  const { edgestore } = useEdgeStore();
  const coverImage = useCoverImage();

  // Create a fresh Y.Doc + provider each time documentId changes.
  // Using useMemo so they're stable within the same document, but recreated
  // when navigating to a different document.
  const { ydoc, provider } = useMemo(() => {
    const doc = new Y.Doc();
    const prov = new YPartyKitProvider(
      "https://notion-clone-party.ng-minhlong.partykit.dev",
      documentId ?? "",
      doc,
    );
    return { ydoc: doc, provider: prov };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // Destroy the provider when documentId changes or component unmounts.
  useEffect(() => {
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  const checkAndConsumeStorage = useMutation(api.userUsage.checkAndConsumeStorage);
  const checkAndConsumeAIUsage = useMutation(api.userUsage.checkAndConsumeAIUsage);
  const addSummaryToHistory = useMutation(api.documents.addSummaryToHistory);
  const freeStorage = useMutation(api.userUsage.freeStorage);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorInstance | null>(null);
  const trackedUrlsRef = useRef<Set<string>>(new Set());
  const fileSizeMapRef = useRef<Map<string, number>>(new Map());
  const yjsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Keep a ref to the latest onChange so Yjs observer never captures a stale
  // closure (avoids saving to the wrong documentId after navigation).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: ydoc.getXmlFragment("document-store"),
      user: {
        name: user?.fullName ?? user?.username ?? "Anonymous",
        color: "#ff0000",
      },
    },
    // Do NOT pass initialContent here — collaboration mode ignores it.
    // Seeding is handled below via editor.replaceBlocks once the editor mounts.
    uploadFile: handleUpload,
    schema,
    dropCursor: multiColumnDropCursor,
    dictionary: {
      ...createBlockNoteDictionary(),
      ai: aiEn,
    },
    extensions: [
      AIExtension({
        transport: new DefaultChatTransport({
          api: "/api/tool/ai",
        }),
      }),
    ],
  }, [ydoc, provider]);


  useEffect(() => {
    editorRef.current = editor;
    trackedUrlsRef.current = getMediaUrls(editor);
    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  // Seed Y.Doc from Convex initialContent every time the editor instance changes
  // (i.e. every time documentId changes). We always overwrite so that navigating
  // back to a document shows the correct saved content instead of whatever was
  // left in the PartyKit room's in-memory state.
  useEffect(() => {
    if (!initialContent) return;

    try {
      const blocks = JSON.parse(initialContent) as PartialBlock[];
      editor.replaceBlocks(editor.document, blocks as any);
    } catch {
      // malformed initialContent — skip seeding
    }
  // Intentionally only re-run when the editor instance changes (documentId change).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Listen to Yjs updates (both local and remote peers) and persist to Convex.
  // BlockNote's onChange only fires for local edits; Yjs remote updates bypass
  // it entirely. We use onChangeRef to always call the latest onChange without
  // re-subscribing the observer on every render, preventing stale-closure saves
  // to the wrong documentId.
  useEffect(() => {
    const fragment = ydoc.getXmlFragment("document-store");

    const handleYjsUpdate = () => {
      if (yjsSaveTimerRef.current) clearTimeout(yjsSaveTimerRef.current);
      yjsSaveTimerRef.current = setTimeout(() => {
        onChangeRef.current(JSON.stringify(editor.document, null, 2));
      }, 500);
    };

    fragment.observeDeep(handleYjsUpdate);
    return () => {
      fragment.unobserveDeep(handleYjsUpdate);
      if (yjsSaveTimerRef.current) clearTimeout(yjsSaveTimerRef.current);
    };
  // Only re-subscribe when the editor/ydoc instance changes (documentId change).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

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
