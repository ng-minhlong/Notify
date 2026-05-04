"use client";

import { useEffect, useState } from "react";

import { SettingsModal } from "@/components/modals/SettingsModal";
import { CoverImageModal } from "@/components/modals/CoverImageModal";
import { CalendarModal } from "@/components/modals/CalendarModal";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { ToolsModal } from "@/components/modals/ToolsModal";
import { SpeechMode } from "@/components/modals/SpeechMode";
import { TemplatesModal } from "@/components/modals/TemplatesModal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <SettingsModal />
      <CoverImageModal />
      <CalendarModal/>
      <UpgradeModal/>
      <ToolsModal/>
      <SpeechMode/>
      <TemplatesModal/>
    </>
  );
};
