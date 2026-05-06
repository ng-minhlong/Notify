"use client";

import { useEffect, useRef, useState } from "react";
import { SpeechBlockStatus } from "@/lib/editor/types";

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
  const recognitionRef = useRef<WebkitSpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef(initialTranscript);
  const shouldKeepRecordingRef = useRef(false);
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
        typeof (window as SpeechWindow).webkitSpeechRecognition !== "undefined",
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
