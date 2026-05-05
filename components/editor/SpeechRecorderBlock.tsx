"use client";

import { Mic, Pause, Radio, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatElapsedTime, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { SpeechBlockStatus } from "@/lib/editor/types";

type SpeechRecorderBlockProps = {
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

export const SpeechRecorderBlock = ({
  blockId,
  initialTranscript,
  initialSummary,
  initialStatus,
  initialErrorMessage,
  initialDurationMs,
  onSpeechBlockUpdate,
  onGenerateSummary,
}: SpeechRecorderBlockProps) => {
  const {
    activeTab,
    elapsedMs,
    error,
    interimTranscript,
    isFinished,
    isProcessing,
    isRecording,
    isSupported,
    setActiveTab,
    startRecognition,
    status,
    stopRecognition,
    summary,
    transcript,
  } = useSpeechRecognition({
    blockId,
    initialTranscript,
    initialSummary,
    initialStatus,
    initialErrorMessage,
    initialDurationMs,
    onSpeechBlockUpdate,
    onGenerateSummary,
  });

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
              {isRecording ? <span className="h-2 w-2 rounded-full bg-rose-500" /> : null}
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
