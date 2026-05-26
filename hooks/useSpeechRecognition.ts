"use client";

import { useEffect, useRef, useState } from "react";
import { SonioxClient } from "@soniox/client";
import { SpeechBlockStatus } from "@/lib/editor/types";

type UseSpeechRecognitionParams = {
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

type SonioxToken = {
  text?: string;
  is_final?: boolean;
  isFinal?: boolean;
};

type SonioxResult = {
  tokens?: SonioxToken[];
};

type SonioxRecording = {
  on: (event: string, handler: (...args: any[]) => void) => void;
  stop: () => Promise<void>;
  cancel?: () => void;
};

const appendTranscript = (current: string, incoming: string) => {
  const nextChunk = incoming.trim();
  if (!nextChunk) return current;
  if (!current.trim()) return nextChunk;

  const spacer = /[\s\n]$/.test(current) ? "" : " ";
  return `${current}${spacer}${nextChunk}`;
};

export const formatElapsedTime = (elapsedMs: number) => {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const isFinalToken = (token: SonioxToken) =>
  Boolean(token.is_final ?? token.isFinal);

const getTokenText = (token: SonioxToken) => token.text ?? "";

let sonioxClient: SonioxClient | null = null;

const getSonioxClient = () => {
  if (!sonioxClient) {
    sonioxClient = new SonioxClient({
      config: async () => {
        const res = await fetch("/api/soniox/tmp-key", {
          method: "POST",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch Soniox temporary key");
        }

        return await res.json();
      },
    });
  }

  return sonioxClient;
};

export const useSpeechRecognition = ({
  blockId,
  initialTranscript,
  initialSummary,
  initialStatus,
  initialErrorMessage,
  initialDurationMs,
  onSpeechBlockUpdate,
  onGenerateSummary,
}: UseSpeechRecognitionParams) => {
  const recordingRef = useRef<SonioxRecording | null>(null);
  const transcriptRef = useRef(initialTranscript);
  const timerRef = useRef<number | null>(null);
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
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices &&
        typeof MediaRecorder !== "undefined",
    );
  }, []);

  const stopTimer = () => {
    if (timerRef.current !== null) {
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
        segmentStartRef.current !== null
          ? Date.now() - segmentStartRef.current
          : 0;

      setElapsedMs(accumulatedMsRef.current + extra);
    }, 250);
  };

  const shutdownRecognition = async () => {
    try {
      recordingRef.current?.cancel?.();
    } catch {
      // noop
    } finally {
      recordingRef.current = null;
    }
  };

  const startRecognition = async () => {
    if (!isSupported) {
      const message = "Trình duyệt này chưa hỗ trợ ghi âm realtime.";
      setStatus("error");
      setError(message);
      setActiveTab("summary");
      onSpeechBlockUpdate(blockId, {
        status: "error",
        errorMessage: message,
      });
      return;
    }

    try {
      await shutdownRecognition();

      const client = getSonioxClient();

      const recording = client.realtime.record({
        model: "stt-rt-v4",
        language_hints: ["vi", "en"],
        enable_endpoint_detection: true,
      }) as unknown as SonioxRecording;

      recordingRef.current = recording;

      recording.on("result", (result: SonioxResult) => {
        const tokens = result.tokens ?? [];

        const finalChunk = tokens
          .filter((token) => isFinalToken(token))
          .map((token) => getTokenText(token))
          .join("");

        const interimChunk = tokens
          .filter((token) => !isFinalToken(token))
          .map((token) => getTokenText(token))
          .join("");

        if (finalChunk.trim()) {
          const nextTranscript = appendTranscript(
            transcriptRef.current,
            finalChunk,
          );

          transcriptRef.current = nextTranscript;
          setTranscript(nextTranscript);
          onSpeechBlockUpdate(blockId, {
            transcript: nextTranscript,
            errorMessage: "",
          });
        }

        setInterimTranscript(interimChunk.trim());
      });

      recording.on("error", (err: unknown) => {
        console.error(err);

        const message = "Không thể tiếp tục nhận giọng nói.";
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
      });

      setStatus("recording");
      setError("");
      setActiveTab("transcript");
      setInterimTranscript("");

      onSpeechBlockUpdate(blockId, {
        status: "recording",
        errorMessage: "",
      });

      startTimer();
    } catch (err) {
      console.error(err);

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
    setInterimTranscript("");
    commitElapsedSegment();
    stopTimer();

    const activeRecording = recordingRef.current;
    recordingRef.current = null;

    if (activeRecording) {
      try {
        await activeRecording.stop();
      } catch (err) {
        console.error(err);
      }
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
      stopTimer();
      void shutdownRecognition();
    };
  }, []);

  return {
    activeTab,
    elapsedMs,
    error,
    interimTranscript,
    isProcessing: status === "processing",
    isRecording: status === "recording",
    isFinished: status === "completed" || status === "error",
    isSupported,
    setActiveTab,
    startRecognition,
    status,
    stopRecognition,
    summary,
    transcript,
  };
};