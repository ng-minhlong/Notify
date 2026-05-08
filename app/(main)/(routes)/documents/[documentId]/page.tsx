"use client";

import dynamic from "next/dynamic";
import { useMemo, use, useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { Cover } from "@/components/cover";
import { ToolbarDocument } from "@/components/toolbar-document";
import { Skeleton } from "@/components/ui/skeleton";
import { NavToolbar } from "@/components/navtoolbar";
import { MinimizeWindowProvider } from "@/components/minimize-window/MinimizeWindowContext";
import { MinimizeWindowAutoCloser } from "@/components/minimize-window/MinimizeWindowAutoCloser";
import { DocumentSidebarComment } from "@/components/sidebar-document/comment";
import { DocumentSidebarQA } from "@/components/sidebar-document/qa";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { BlockNoteEditor } from "@blocknote/core";
import { TableOfContents } from "@/components/table-of-contents";
import { useEditorFont } from "@/hooks/useEditorFont";
import { CommentRequestDetail } from "@/lib/editor/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface QAConversation {
  messages: ChatMessage[];
  createdAt: number;
}

interface DocumentCommentViewModel {
  id: string;
  number: number;
  blockId: string;
  blockType?: string;
  selectedText: string;
  fallbackText: string;
  content: string;
  createdAt: number;
  updatedAt: number;
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
  const [sidebarMode, setSidebarMode] = useState<"qa" | "comments">("qa");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // QA Sidebar states
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [selectedQAConversation, setSelectedQAConversation] = useState<QAConversation | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [pendingComment, setPendingComment] = useState<CommentRequestDetail | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

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
  const comments = useQuery(api.documentComments.getByDocument, {
    documentId,
  });

  const { editorFont, isFontLoading } = useEditorFont({ enabled: true });

  const update = useMutation(api.documents.update);
  const addQAToHistory = useMutation(api.documents.addQAToHistory);
  const createComment = useMutation(api.documentComments.create);
  const updateComment = useMutation(api.documentComments.update);
  const deleteComment = useMutation(api.documentComments.remove);
  const checkAndConsumeAIUsage = useMutation(api.userUsage.checkAndConsumeAIUsage);

  // Parse QA history
  const qaHistory: QAConversation[] = doc?.qAHistory
    ? JSON.parse(doc.qAHistory)
    : [];
  const commentItems: DocumentCommentViewModel[] = (comments ?? []).map((comment, index) => ({
    id: comment._id,
    number: index + 1,
    blockId: comment.blockId,
    blockType: comment.blockType,
    selectedText: comment.selectedText || "",
    fallbackText: comment.fallbackText || "",
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  }));
  const activeComment = commentItems.find((comment) => comment.id === activeCommentId) ?? null;

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
    setSidebarMode("qa");
    setIsSidebarOpen(true);
  };

  const openCommentsSidebar = (commentId?: string) => {
    setSidebarMode("comments");
    setIsSidebarOpen(true);
    setActiveCommentId(commentId ?? null);
  };

  const handleSaveComment = async () => {
    if (!pendingComment?.blockId) {
      toast.error("Cannot attach comment to this block.");
      return;
    }

    const content = newCommentContent.trim();
    if (!content) {
      toast.error("Comment content is required.");
      return;
    }

    setSavingComment(true);
    try {
      const commentId = await createComment({
        documentId,
        blockId: pendingComment.blockId,
        blockType: pendingComment.blockType,
        selectedText: pendingComment.selectedText || undefined,
        fallbackText: pendingComment.fallbackText || undefined,
        content,
      });

      setPendingComment(null);
      setNewCommentContent("");
      setActiveCommentId(commentId);
      openCommentsSidebar(commentId);
      toast.success("Comment saved.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save comment.");
    } finally {
      setSavingComment(false);
    }
  };

  const handleConfirmEditComment = async () => {
    if (!editingCommentId) return;

    const content = editingCommentContent.trim();
    if (!content) {
      toast.error("Comment content is required.");
      return;
    }

    setSavingComment(true);
    try {
      await updateComment({
        commentId: editingCommentId as Id<"documentComments">,
        content,
      });
      setEditingCommentId(null);
      setEditingCommentContent("");
      toast.success("Comment updated.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update comment.");
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await deleteComment({
        commentId: commentId as Id<"documentComments">,
      });
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingCommentContent("");
      }
      setActiveCommentId((current) => (current === commentId ? null : current));
      toast.success("Comment deleted.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete comment.");
    } finally {
      setDeletingCommentId(null);
    }
  };

  useEffect(() => {
    if (!doc) return;

    const defaultFavicon =
      resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg";

    window.document.title = `${doc.title} | Notify`;

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

  useEffect(() => {
    const handleCommentRequest = (event: Event) => {
      const customEvent = event as CustomEvent<CommentRequestDetail>;
      const detail = customEvent.detail;

      setPendingComment(detail);
      setNewCommentContent("");
      setEditingCommentId(null);
      setEditingCommentContent("");
      setActiveCommentId(null);
    };

    window.addEventListener("notify-editor-comment", handleCommentRequest as EventListener);

    return () => {
      window.removeEventListener(
        "notify-editor-comment",
        handleCommentRequest as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (activeCommentId && !commentItems.some((comment) => comment.id === activeCommentId)) {
      setActiveCommentId(null);
    }
  }, [activeCommentId, commentItems]);

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
          isSidebarOpen ? 'md:mr-96' : ''
        }`}>
          <NavToolbar askAIEntireNote={askAIEntireNote} />
          <ToolbarDocument initialData={doc} editorFont={activeFont} />
          <Editor
            onChange={onChange}
            initialContent={doc.content}
            onEditorReady={setEditor}
            editorFont={activeFont}
            comments={commentItems.map((comment) => ({
              id: comment.id,
              blockId: comment.blockId,
              number: comment.number,
            }))}
            pendingComment={pendingComment}
            pendingCommentContent={newCommentContent}
            savingComment={savingComment}
            onPendingCommentChange={setNewCommentContent}
            onPendingCommentSave={handleSaveComment}
            onPendingCommentCancel={() => {
              setPendingComment(null);
              setNewCommentContent("");
            }}
            activeComment={
              activeComment
                ? {
                    id: activeComment.id,
                    blockId: activeComment.blockId,
                    selectedText: activeComment.selectedText,
                    fallbackText: activeComment.fallbackText,
                  }
                : null
            }
            onCommentBadgeClick={(commentId) => {
              setPendingComment(null);
              setNewCommentContent("");
              setEditingCommentId(null);
              setEditingCommentContent("");
              openCommentsSidebar(commentId);
            }}
          />
          <TableOfContents editor={editor} />
        </div>
      </div>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 md:hidden ${
          isSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div className={`fixed inset-x-0 bottom-0 z-50 flex h-[50dvh] flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl transition-transform duration-300 ease-in-out md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:w-96 md:rounded-none md:border-t md:border-r-0 md:border-b-0 md:border-l ${
        isSidebarOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full md:translate-y-0"
      }`}>
        <div className="flex justify-center pt-2 md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant={sidebarMode === "qa" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSidebarMode("qa")}
            >
              Ask AI
            </Button>
            <Button
              variant={sidebarMode === "comments" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSidebarMode("comments")}
            >
              Comments
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)}>
            X
          </Button>
        </div>

        <div className="min-h-0 flex-1">
          {sidebarMode === "qa" ? (
            <DocumentSidebarQA
              qaHistory={qaHistory}
              currentMessages={currentMessages}
              setCurrentMessages={setCurrentMessages}
              selectedQAConversation={selectedQAConversation}
              setSelectedQAConversation={setSelectedQAConversation}
              inputValue={inputValue}
              setInputValue={setInputValue}
              qaLoading={qaLoading}
              onSendMessage={handleSendQAMessage}
            />
          ) : (
            <DocumentSidebarComment
              comments={commentItems}
              activeCommentId={activeCommentId}
              editingCommentId={editingCommentId}
              editingContent={editingCommentContent}
              savingComment={savingComment}
              deletingCommentId={deletingCommentId}
              onSelectComment={(commentId) => {
                setPendingComment(null);
                setNewCommentContent("");
                setEditingCommentId(null);
                setEditingCommentContent("");
                setActiveCommentId(commentId);
              }}
              onStartEdit={(comment) => {
                setPendingComment(null);
                setNewCommentContent("");
                setActiveCommentId(comment.id);
                setEditingCommentId(comment.id);
                setEditingCommentContent(comment.content);
              }}
              onEditContentChange={setEditingCommentContent}
              onConfirmEdit={handleConfirmEditComment}
              onCancelEdit={() => {
                setEditingCommentId(null);
                setEditingCommentContent("");
              }}
              onDeleteComment={handleDeleteComment}
            />
          )}
        </div>
      </div>
    </MinimizeWindowProvider>
  );
};
export default DocumentIdPage;
