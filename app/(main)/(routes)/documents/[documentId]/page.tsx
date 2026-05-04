"use client";

import dynamic from "next/dynamic";
import { useMemo, use, useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { Cover } from "@/components/cover";
import { ToolbarDocument } from "@/components/toolbarDocument";
import { Skeleton } from "@/components/ui/skeleton";
import { NavToolbar } from "@/components/navtoolbar";
import { MinimizeWindowProvider } from "@/components/minimize-window/MinimizeWindowContext";
import { MinimizeWindowAutoCloser } from "@/components/minimize-window/MinimizeWindowAutoCloser";
import { QASidebar } from "@/components/qa-sidebar";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { BlockNoteEditor } from "@blocknote/core";
import { TableOfContents } from "@/components/table-of-contents";
import { useEditorFont } from "@/hooks/useEditorFont";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface QAConversation {
  messages: ChatMessage[];
  createdAt: number;
}

interface DocumentIdPageProps {
  params: Promise<{
    documentId: Id<"documents">;
  }>;
}






const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const { documentId } = use(params);
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);
  const { resolvedTheme } = useTheme();

  // QA Sidebar states
  const [isQASidebarOpen, setIsQASidebarOpen] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [selectedQAConversation, setSelectedQAConversation] = useState<QAConversation | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [qaLoading, setQaLoading] = useState(false);

  const Editor = useMemo(
    () => dynamic(() => import("@/components/editor"), { ssr: false }),
    [],
  );

  // Hàm lấy text editor cho minimize window
  const getEditorText = () => {
    const blocks = document.querySelectorAll('[data-node-type="blockOuter"]');
    return Array.from(blocks).map(b => b.textContent.trim()).filter(Boolean).join("\n");
  };


  const doc = useQuery(api.documents.getById, {
    documentId: documentId,
  });

  const { editorFont, isFontLoading } = useEditorFont({ enabled: true });

  const update = useMutation(api.documents.update);
  const addQAToHistory = useMutation(api.documents.addQAToHistory);
  const checkAndConsumeAIUsage = useMutation(api.userUsage.checkAndConsumeAIUsage);

  // Parse QA history
  const qaHistory: QAConversation[] = doc?.qAHistory
    ? JSON.parse(doc.qAHistory)
    : [];

  // Handle send QA message
  const handleSendQAMessage = async () => {
    if (!inputValue.trim()) return;

    const documentText = getEditorText();
    if (!documentText || documentText.length < 10) {
      toast.error("Document content is too short");
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue("");

    // Add user message to current chat
    const updatedMessages = [...currentMessages, { role: "user" as const, content: userMessage }];
    setCurrentMessages(updatedMessages);

    setQaLoading(true);
    try {
      // ✅ CHECK AND CONSUME AI USAGE FIRST
      await checkAndConsumeAIUsage({ amount: 1 });

      const res = await fetch("/api/tool/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: documentText,
          question: userMessage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Failed to get AI response");
      }

      const data = await res.json();
      const assistantMessage = data.answer || "No response";

      // Add assistant message
      const finalMessages = [...updatedMessages, { role: "assistant" as const, content: assistantMessage }];
      setCurrentMessages(finalMessages);

      // Save to history
      await addQAToHistory({
        id: documentId,
        conversation: JSON.stringify(finalMessages),
      });

      toast.success("Conversation saved!");
    } catch (e: any) {
      // Check if it's a limit error
      if (e.message && e.message.includes("limit exceeded")) {
        toast.error(e.message);
      } else {
        toast.error(e.message || "Failed to process question");
      }
      // Remove the user message if AI failed
      setCurrentMessages(currentMessages);
    } finally {
      setQaLoading(false);
    }
  };

  // Handle ask AI entire note
  const askAIEntireNote = () => {
    setCurrentMessages([]);
    setSelectedQAConversation(null);
    setInputValue("");
    setIsQASidebarOpen(true);
  };

  useEffect(() => {
    if (!doc) return;

    const defaultFavicon =
      resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg";

    window.document.title = `${doc.title || "Untitled"} | Notify`;

    const link = window.document.querySelector(
      "link[rel~='icon']",
    ) as HTMLLinkElement;
    if (link) {
      link.href = doc.icon
        ? `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='100'>${doc.icon}</text></svg>`
        : defaultFavicon;
    }

    return () => {
      window.document.title = "Notify";
      if (link) link.href = defaultFavicon;
    };
  }, [doc, resolvedTheme, documentId]);

  useEffect(() => {
    if (!doc) return;
    if (doc.editorFont === editorFont) return;

    update({
      id: documentId,
      editorFont,
    });
  }, [doc, editorFont, documentId, update]);

  const activeFont = doc?.editorFont ?? editorFont;

  const onChange = (content: string) => {
    update({
      id: documentId,
      content,
    });
  };

  if (doc === undefined || isFontLoading) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="mx-auto mt-10 md:max-w-3xl lg:max-w-4xl">
          <div className="space-y-4 pt-4 pl-8">
            <Skeleton className="h-14 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    );
  }

  if (doc === null) {
    return <div>Not found</div>;
  }

  return (
    <MinimizeWindowProvider>
      <MinimizeWindowAutoCloser getEditorText={getEditorText} documentId={documentId} />
      <div className="pb-35">
        <Cover url={doc.coverImage} />
        <div className={`relative mx-auto md:w-[90%] transition-all duration-300 ${
          isQASidebarOpen ? 'md:mr-96' : ''
        }`}>
          <NavToolbar askAIEntireNote={askAIEntireNote} />
          <p>Created At: {new Date(doc._creationTime).toLocaleString()}</p>
          <p>Last Update At: {new Date(doc.updatedAt || "").toLocaleString()}</p>
          <ToolbarDocument initialData={doc} editorFont={activeFont} />
          <Editor
            onChange={onChange}
            initialContent={doc.content}
            onEditorReady={setEditor}
            editorFont={activeFont}
          />
          <TableOfContents editor={editor} />
        </div>
      </div>
      <QASidebar
        isOpen={isQASidebarOpen}
        onClose={() => setIsQASidebarOpen(false)}
        qaHistory={qaHistory}
        currentMessages={currentMessages}
        setCurrentMessages={setCurrentMessages}
        selectedQAConversation={selectedQAConversation}
        setSelectedQAConversation={setSelectedQAConversation}
        inputValue={inputValue}
        setInputValue={setInputValue}
        qaLoading={qaLoading}
        onSendMessage={handleSendQAMessage}
        documentId={documentId}
      />
    </MinimizeWindowProvider>
  );
};
export default DocumentIdPage;
