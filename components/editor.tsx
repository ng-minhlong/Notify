"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorFont } from "@/hooks/useEditorFont";
import { useCoverImage } from "@/hooks/useCoverImage";
import { fontFamilies } from "@/lib/editorFont";
import {
  BlockNoteEditor,
  BlockNoteSchema,
  PartialBlock,
  createCodeBlockSpec,
  defaultProps,
} from "@blocknote/core";
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import {
  createReactBlockSpec,
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "next-themes";
import { useEdgeStore } from "@/lib/edgestore";
import { codeBlockOptions } from "@blocknote/code-block";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Mic, Pause, Radio, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  editorFont?: string;
  onEditorReady?: (editor: any) => void;
}

type EmbedProvider = "youtube" | "drive" | "figma";

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type WebkitSpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechWindow = Window & {
  webkitSpeechRecognition?: new () => WebkitSpeechRecognitionInstance;
};

const EMBED_PROVIDER_META: Record<
  EmbedProvider,
  {
    label: string;
    placeholder: string;
  }
> = {
  youtube: {
    label: "YouTube",
    placeholder: "Dán link YouTube vào đây",
  },
  drive: {
    label: "Google Drive",
    placeholder: "Dán link Google Drive vào đây",
  },
  figma: {
    label: "Figma",
    placeholder: "Dán link Figma vào đây",
  },
};

const appendTranscript = (current: string, incoming: string) => {
  const nextChunk = incoming.trim();
  if (!nextChunk) return current;
  if (!current.trim()) return nextChunk;

  const spacer = /[\s\n]$/.test(current) ? "" : " ";
  return `${current}${spacer}${nextChunk}`;
};

const formatElapsedTime = (elapsedMs: number) => {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const MIN_SUMMARY_LENGTH = 50;

type SpeechBlockStatus = "idle" | "recording" | "processing" | "completed" | "error";

type EditableSpeechRecorderBlockProps = {
  blockId: string;
  initialTranscript: string;
  initialSummary: string;
  initialStatus: SpeechBlockStatus;
  initialErrorMessage: string;
  initialDurationMs: string;
  onSpeechBlockUpdate: (
    blockId: string,
    props: Record<string, string>,
  ) => void;
  onGenerateSummary: (blockId: string, transcript: string) => Promise<void>;
};

const EditableSpeechRecorderBlock = ({
  blockId,
  initialTranscript,
  initialSummary,
  initialStatus,
  initialErrorMessage,
  initialDurationMs,
  onSpeechBlockUpdate,
  onGenerateSummary,
}: EditableSpeechRecorderBlockProps) => {
  const recognitionRef = useRef<WebkitSpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef(initialTranscript);
  const shouldKeepRecordingRef = useRef(false);
  const timerRef = useRef<any>(null);
  const segmentStartRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(Number(initialDurationMs) || 0);

  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<SpeechBlockStatus>(initialStatus);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [summary, setSummary] = useState(initialSummary);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [elapsedMs, setElapsedMs] = useState(Number(initialDurationMs) || 0);
  const [error, setError] = useState(initialErrorMessage);
  const [activeTab, setActiveTab] = useState<"transcript" | "summary">(
    initialSummary ? "summary" : "transcript",
  );
  const isRecording = status === "recording";
  const isProcessing = status === "processing";
  const isFinished = status === "completed" || status === "error";

  useEffect(() => {
    transcriptRef.current = initialTranscript;
    setTranscript(initialTranscript);
  }, [initialTranscript]);

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setError(initialErrorMessage);
  }, [initialErrorMessage]);

  useEffect(() => {
    const parsedDuration = Number(initialDurationMs) || 0;
    accumulatedMsRef.current = parsedDuration;
    setElapsedMs(parsedDuration);
  }, [initialDurationMs]);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
        typeof (window as SpeechWindow).webkitSpeechRecognition !== "undefined",
    );
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const commitElapsedSegment = () => {
    if (segmentStartRef.current !== null) {
      accumulatedMsRef.current += Date.now() - segmentStartRef.current;
      segmentStartRef.current = null;
      setElapsedMs(accumulatedMsRef.current);
      onSpeechBlockUpdate(blockId, {
        durationMs: `${accumulatedMsRef.current}`,
      });
    }
  };

  const startTimer = () => {
    stopTimer();
    segmentStartRef.current = Date.now();
    setElapsedMs(accumulatedMsRef.current);
    timerRef.current = window.setInterval(() => {
      const extra =
        segmentStartRef.current !== null ? Date.now() - segmentStartRef.current : 0;
      setElapsedMs(accumulatedMsRef.current + extra);
    }, 250);
  };

  const shutdownRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const startRecognition = () => {
    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? (window as SpeechWindow).webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionCtor) {
      const message = "Trình duyệt này chưa hỗ trợ Web Speech API bằng webkit.";
      setStatus("error");
      setError(message);
      setActiveTab("summary");
      onSpeechBlockUpdate(blockId, {
        status: "error",
        errorMessage: message,
      });
      return;
    }

    shutdownRecognition();

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "vi-VN";

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const chunk = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalChunk += `${chunk} `;
        } else {
          interimChunk += chunk;
        }
      }

      if (finalChunk.trim()) {
        const nextTranscript = appendTranscript(
          transcriptRef.current,
          finalChunk.trim(),
        );

        transcriptRef.current = nextTranscript;
        setTranscript(nextTranscript);
        setInterimTranscript(interimChunk.trim());
        onSpeechBlockUpdate(blockId, {
          transcript: nextTranscript,
          errorMessage: "",
        });
      } else {
        setInterimTranscript(interimChunk.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;

      const message = "Không thể tiếp tục nhận giọng nói.";
      shouldKeepRecordingRef.current = false;
      commitElapsedSegment();
      stopTimer();
      setStatus("error");
      setError(message);
      setActiveTab("summary");
      onSpeechBlockUpdate(blockId, {
        status: "error",
        errorMessage: message,
        durationMs: `${accumulatedMsRef.current}`,
      });
    };

    recognition.onend = () => {
      commitElapsedSegment();
      stopTimer();
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      shouldKeepRecordingRef.current = true;
      setStatus("recording");
      setError("");
      setActiveTab("transcript");
      setInterimTranscript("");
      onSpeechBlockUpdate(blockId, {
        status: "recording",
        errorMessage: "",
      });
      startTimer();
    } catch {
      const message = "Microphone đang bận hoặc chưa được cấp quyền.";
      setStatus("error");
      setError(message);
      setActiveTab("summary");
      onSpeechBlockUpdate(blockId, {
        status: "error",
        errorMessage: message,
      });
    }
  };

  const stopRecognition = async () => {
    shouldKeepRecordingRef.current = false;
    setInterimTranscript("");
    commitElapsedSegment();
    stopTimer();

    if (recognitionRef.current) {
      const activeRecognition = recognitionRef.current;
      recognitionRef.current = null;
      activeRecognition.onresult = null;
      activeRecognition.onerror = null;
      activeRecognition.onend = null;
      activeRecognition.stop();
    }

    const finalTranscript = transcriptRef.current.trim();
    if (!finalTranscript) {
      const message = "Chưa có transcript để tạo summary.";
      setStatus("error");
      setError(message);
      setActiveTab("summary");
      onSpeechBlockUpdate(blockId, {
        status: "error",
        errorMessage: message,
        durationMs: `${accumulatedMsRef.current}`,
      });
      return;
    }

    setStatus("processing");
    setError("");
    setActiveTab("summary");
    onSpeechBlockUpdate(blockId, {
      status: "processing",
      errorMessage: "",
      durationMs: `${accumulatedMsRef.current}`,
    });

    await onGenerateSummary(blockId, finalTranscript);
  };

  useEffect(() => {
    return () => {
      shouldKeepRecordingRef.current = false;
      stopTimer();
      shutdownRecognition();
    };
  }, []);

  return (
    <div
      className="my-3 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900"
      contentEditable={false}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            {isRecording ? <Radio className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              <span>
                {isRecording
                  ? "Recording"
                  : isProcessing
                    ? "Generating summary"
                    : isFinished
                      ? "Saved speech note"
                      : "Speech to text"}
              </span>
              {isRecording && <span className="h-2 w-2 rounded-full bg-rose-500" />}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {isRecording
                ? "Đang nghe giọng nói và lưu transcript vào block này"
                : isProcessing
                  ? "Đang tạo summary và lưu lại vào document"
                  : isFinished
                    ? "Block này đã dừng ghi và không thể record lại"
                    : "Nhấn Start Record để bắt đầu ghi âm bằng webkit"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium tabular-nums text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
            {formatElapsedTime(elapsedMs)}
          </div>

          {isRecording ? (
            <button
              type="button"
              onClick={() => {
                void stopRecognition();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              <Pause className="h-4 w-4" />
              Stop Record
            </button>
          ) : status === "idle" ? (
            <button
              type="button"
              onClick={startRecognition}
              disabled={!isSupported}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900"
            >
              <Mic className="h-4 w-4" />
              Start Record
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "transcript" | "summary")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="mt-3">
            <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-[15px] leading-7 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-200">
              {transcript || interimTranscript ? (
                <>
                  <span>{transcript}</span>
                  {interimTranscript ? (
                    <span className="ml-1 text-zinc-400 dark:text-zinc-500">
                      {interimTranscript}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500">
                  Bắt đầu nói để transcript xuất hiện ở đây...
                </span>
              )}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="mt-3">
            <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-[15px] leading-7 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-200">
              {isProcessing ? (
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>Đang tạo summary từ transcript...</span>
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  {error}
                </div>
              ) : summary ? (
                <span>{summary}</span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500">
                  Summary sẽ xuất hiện ở đây sau khi bạn Stop Record.
                </span>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const extractYouTubeId = (inputUrl: string): string | null => {
  try {
    const url = new URL(inputUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host.endsWith("youtube.com")) {
      const directId = url.searchParams.get("v");
      if (directId) return directId;

      const parts = url.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }
    }

    return null;
  } catch {
    return null;
  }
};

const normalizeEmbedUrl = (provider: EmbedProvider, inputUrl: string): string => {
  const trimmed = inputUrl.trim();

  if (provider === "youtube") {
    const videoId = extractYouTubeId(trimmed);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
  }

  if (provider === "drive") {
    try {
      const url = new URL(trimmed);
      const href = url.href;

      if (href.includes("/preview")) return href;
      if (href.includes("/view")) return href.replace("/view", "/preview");
      if (href.includes("/edit")) return href.replace("/edit", "/preview");

      return href;
    } catch {
      return trimmed;
    }
  }

  if (provider === "figma") {
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
};

const getProviderFromEmbedUrl = (url: string): EmbedProvider | null => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");

    if (host === "youtu.be" || host.endsWith("youtube.com")) return "youtube";
    if (host.endsWith("drive.google.com")) return "drive";
    if (host.endsWith("figma.com")) return "figma";

    return null;
  } catch {
    return null;
  }
};

const createEmbedBlock = createReactBlockSpec(
  {
    type: "embed",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      provider: {
        default: "youtube",
        values: ["youtube", "drive", "figma"],
      },
      url: {
        default: "",
      },
      embedUrl: {
        default: "",
      },
      title: {
        default: "",
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const provider = props.block.props.provider as EmbedProvider;
      const originalUrl = props.block.props.url as string;
      const embedUrl = props.block.props.embedUrl as string;
      const title = (props.block.props.title as string) || EMBED_PROVIDER_META[provider].label;

      return (
        <div
          className="my-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          contentEditable={false}
        >
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {title}
              </div>
              <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {originalUrl}
              </div>
            </div>

            <a
              href={originalUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Open
            </a>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="h-[420px] w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex h-[220px] items-center justify-center px-4 text-sm text-zinc-500">
                Không tạo được preview cho link này.
              </div>
            )}
          </div>
        </div>
      );
    },
  },
);

const MEDIA_BLOCK_TYPES = new Set(["image", "video", "audio", "file"]);

const getMediaUrls = (editor: any): Set<string> => {
  const urls = new Set<string>();

  editor.forEachBlock((block: any) => {
    if (MEDIA_BLOCK_TYPES.has(block.type)) {
      const url = (block.props as any)?.url;
      if (url && typeof url === "string" && url.trim() !== "") {
        urls.add(url);
      }
    }
    return true;
  });

  return urls;
};

const getCustomSlashMenuItems = (
  editor: any,
  openEmbedModal: (provider: EmbedProvider) => void,
  onInsertSpeechBlock: () => void,
): DefaultReactSuggestionItem[] => {
  const speechItems: DefaultReactSuggestionItem[] = [
    {
      title: "Speech to Text",
      subtext: "Record giọng nói và tự chèn transcript",
      group: "Input",
      aliases: ["speech", "voice", "record", "audio", "transcribe", "dictation"],
      onItemClick: () => onInsertSpeechBlock(),
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

  return [...getDefaultReactSlashMenuItems(editor), ...speechItems, ...embedItems];
};

const Editor = ({
  onChange,
  initialContent,
  editable = true,
  editorFont,
  onEditorReady,
}: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const params = useParams();
  const documentId = params?.documentId as Id<"documents"> | undefined;
  const { edgestore } = useEdgeStore();
  const checkAndConsumeStorage = useMutation(api.userUsage.checkAndConsumeStorage);
  const checkAndConsumeAIUsage = useMutation(api.userUsage.checkAndConsumeAIUsage);
  const addSummaryToHistory = useMutation(api.documents.addSummaryToHistory);

  const coverImage = useCoverImage();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const trackedUrlsRef = useRef<Set<string>>(new Set());
  const fileSizeMapRef = useRef<Map<string, number>>(new Map());
  const freeStorage = useMutation(api.userUsage.freeStorage);

  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [embedProvider, setEmbedProvider] = useState<EmbedProvider>("youtube");
  const [embedInputUrl, setEmbedInputUrl] = useState("");
  const [embedError, setEmbedError] = useState<string | null>(null);

  const openEmbedModal = (provider: EmbedProvider) => {
    setEmbedProvider(provider);
    setEmbedInputUrl("");
    setEmbedError(null);
    setEmbedDialogOpen(true);
  };

  const closeEmbedModal = () => {
    setEmbedDialogOpen(false);
    setEmbedInputUrl("");
    setEmbedError(null);
  };

  const handleUpload = async (file: File) => {
    try {
      // ✅ CHECK STORAGE BEFORE UPLOADING
      await checkAndConsumeStorage({ fileSizeBytes: file.size });

      const res = await edgestore.publicFiles.upload({ file });
      // Store file size for later deletion tracking
      fileSizeMapRef.current.set(res.url, file.size);
      return res.url;
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
      throw error;
    }
  };

  const updateSpeechBlockProps = (
    blockId: string,
    props: Record<string, string>,
  ) => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;

    currentEditor.updateBlock(blockId, {
      type: "speech",
      props,
    });
  };

  const generateSpeechSummary = async (blockId: string, transcript: string) => {
    const normalizedTranscript = transcript.trim();

    if (normalizedTranscript.length < MIN_SUMMARY_LENGTH) {
      const errorMessage = `Transcript phải có ít nhất ${MIN_SUMMARY_LENGTH} ký tự để tạo summary.`;
      updateSpeechBlockProps(blockId, {
        status: "error",
        errorMessage,
      });
      return;
    }

    try {
      await checkAndConsumeAIUsage({ amount: 1 });

      const res = await fetch("/api/tool/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: normalizedTranscript }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Failed to generate summary");
      }

      const data = await res.json();
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
    } catch (error: any) {
      updateSpeechBlockProps(blockId, {
        status: "error",
        errorMessage: error?.message || "Không thể tạo summary cho transcript này.",
      });
    }
  };

  const schema = useMemo(() => {
    const speechBlock = createReactBlockSpec(
      {
        type: "speech",
        propSchema: {
          textAlignment: defaultProps.textAlignment,
          textColor: defaultProps.textColor,
          transcript: {
            default: "",
          },
          summary: {
            default: "",
          },
          status: {
            default: "idle",
            values: ["idle", "recording", "processing", "completed", "error"],
          },
          errorMessage: {
            default: "",
          },
          durationMs: {
            default: "0",
          },
        },
        content: "none",
      },
      {
        render: (props) => {
          const blockId = props.block.id;
          const transcript = (props.block.props.transcript as string) || "";
          const summary = (props.block.props.summary as string) || "";
          const status =
            ((props.block.props.status as string) || "idle") as SpeechBlockStatus;
          const errorMessage =
            (props.block.props.errorMessage as string) || "";
          const durationMs = (props.block.props.durationMs as string) || "0";

          return (
            <EditableSpeechRecorderBlock
              blockId={blockId}
              initialTranscript={transcript}
              initialSummary={summary}
              initialStatus={status}
              initialErrorMessage={errorMessage}
              initialDurationMs={durationMs}
              onSpeechBlockUpdate={updateSpeechBlockProps}
              onGenerateSummary={generateSpeechSummary}
            />
          );
        },
      },
    );

    return BlockNoteSchema.create().extend({
      blockSpecs: {
        codeBlock: createCodeBlockSpec({
          ...codeBlockOptions,
          defaultLanguage: "typescript",
          supportedLanguages: {
            typescript: { name: "TypeScript", aliases: ["ts"] },
            javascript: { name: "JavaScript", aliases: ["js"] },
            python: { name: "Python", aliases: ["py"] },
            cpp: { name: "C++", aliases: ["cpp", "c++"] },
            java: { name: "Java" },
            rust: { name: "Rust", aliases: ["rs"] },
            go: { name: "Go" },
            sql: { name: "SQL" },
            html: { name: "HTML" },
            css: { name: "CSS" },
          },
        }),
        embed: createEmbedBlock(),
        speech: speechBlock(),
      },
    });
  }, [addSummaryToHistory, checkAndConsumeAIUsage, documentId]);

  const editor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleUpload,
    schema,
  });

  useEffect(() => {
    editorRef.current = editor;
    if (editor) {
      trackedUrlsRef.current = getMediaUrls(editor);
    }
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  const insertEmbedBlock = () => {
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

    const cursor = editor.getTextCursorPosition();
    const currentBlock = cursor?.block;

    if (!currentBlock) {
      toast.error("Không tìm thấy vị trí con trỏ hiện tại.");
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
      ],
      currentBlock,
      "after",
    );

    editor.setTextCursorPosition(spacerId, "start");
    closeEmbedModal();
  };

  const insertSpeechBlock = () => {
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

  const handleEditorChange = () => {
    const currentUrls = getMediaUrls(editor);
    const previousUrls = trackedUrlsRef.current;

    const removedUrls = [...previousUrls].filter(
      (url) => !currentUrls.has(url),
    );

    removedUrls.forEach((url) => {
      // Get file size and free storage
      const fileSize = fileSizeMapRef.current.get(url);
      if (fileSize) {
        freeStorage({ fileSizeBytes: fileSize }).catch((err) => {
          console.warn("Failed to free storage for deleted file:", url, err);
        });
        fileSizeMapRef.current.delete(url);
      }

      edgestore.publicFiles.delete({ url }).catch((err) => {
        console.warn("Failed to delete file in edgestore:", url, err);
      });
    });
    trackedUrlsRef.current = currentUrls;

    onChange(JSON.stringify(editor.document, null, 2));
  };

  const handleCapture = (e: React.DragEvent) => {
    if (coverImage.isOpen) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editable || coverImage.isOpen) return;

    const blockEl = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-node-type='blockContainer']",
    );
    if (!blockEl) return;

    const blockId = blockEl.getAttribute("data-id");
    if (!blockId) return;

    const currentBlock = editor.getBlock(blockId);
    if (!currentBlock) return;
    const prevBlock = editor.getPrevBlock(blockId);
    if (!prevBlock) return;

    if (!MEDIA_BLOCK_TYPES.has(prevBlock?.type as string)) return;

    e.stopPropagation();

    const view = (editor as any)._tiptapEditor.view;
    const pos = view.posAtCoords({ left: e.clientX, top: e.clientY });

    if (pos) {
      view.dispatch(
        view.state.tr.setSelection(
          view.state.selection.constructor.near(
            view.state.doc.resolve(pos.pos),
          ),
        ),
      );
    }
    editor.focus();
  };

  const customSlashMenuItems = useMemo(() => {
    return getCustomSlashMenuItems(editor, openEmbedModal, insertSpeechBlock);
  }, [editor]);

  return (
    <div
      ref={wrapperRef}
      className="relative flex-1 shrink-0 pb-10"
      style={
        {
          "--editor-font": fontFamilies[editorFont as EditorFont],
        } as React.CSSProperties
      }
      onDropCapture={handleCapture}
      onDragOverCapture={handleCapture}
      onMouseDown={handleMouseDown}
    >
      <BlockNoteView
        editable={editable && !coverImage.isOpen}
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={handleEditorChange}
        className="wrap-break-word"
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(customSlashMenuItems, query)
          }
        />
      </BlockNoteView>

      {embedDialogOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEmbedModal();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Embed Link
              </div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {EMBED_PROVIDER_META[embedProvider].label}
              </div>
            </div>

            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Paste link
            </label>
            <input
              autoFocus
              value={embedInputUrl}
              onChange={(e) => {
                setEmbedInputUrl(e.target.value);
                setEmbedError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertEmbedBlock();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  closeEmbedModal();
                }
              }}
              placeholder={EMBED_PROVIDER_META[embedProvider].placeholder}
              className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />

            {embedError ? (
              <div className="mt-2 text-xs text-red-500">{embedError}</div>
            ) : (
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Enter or click Ok to insert preview
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeEmbedModal}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertEmbedBlock}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
