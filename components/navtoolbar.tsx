"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MinimizeWindowProvider } from "./minimize-window/MinimizeWindowContext";
import { MinimizeWindowButton } from "./minimize-window/MinimizeWindowButton";
import { Button } from "@/components/ui/button";
import { ClipboardCopy, BookOpen, FileText, Zap } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MindmapViewer } from "./mindmap-viewer";

// Helper to get all text from the editor
function getEditorText() {
    const blocks = document.querySelectorAll('[data-node-type="blockOuter"]');

    return Array.from(blocks)
        .map(b => b.textContent.trim())
        .filter(Boolean)
        .join("\n");
}

interface SummaryItem {
    content: string;
    createdAt: number;
}

interface MindmapItem {
    content: string;
    createdAt: number;
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface QAConversation {
    messages: ChatMessage[];
    createdAt: number;
}

export function NavToolbar() {
    const params = useParams();
    const documentId = params?.documentId as Id<"documents">;
    
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedSummary, setSelectedSummary] = useState<SummaryItem | null>(null);
    const [showMindmapModal, setShowMindmapModal] = useState(false);
    const [selectedMindmap, setSelectedMindmap] = useState<MindmapItem | null>(null);
    const [QAEntireOpen, setQAEntireOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mindmapLoading, setMindmapLoading] = useState(false);
    const [qaLoading, setQaLoading] = useState(false);
    const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
    const [selectedQAConversation, setSelectedQAConversation] = useState<QAConversation | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [isInChatMode, setIsInChatMode] = useState(false);

    // Fetch document to get summary history
    const doc = useQuery(api.documents.getById, {
        documentId: documentId,
    });

    // Mutation to add summary to history
    const addSummaryToHistory = useMutation(api.documents.addSummaryToHistory);
    // Mutation to add mindmap to history
    const addMindmapToHistory = useMutation(api.documents.addMindmapToHistory);
    // Mutation to add QA to history
    const addQAToHistory = useMutation(api.documents.addQAToHistory);
    // Mutation to check and consume AI usage
    const checkAndConsumeAIUsage = useMutation(api.userUsage.checkAndConsumeAIUsage);

    // Parse summary history
    const summaryHistory: SummaryItem[] = doc?.summaryHistory
        ? JSON.parse(doc.summaryHistory)
        : [];

    // Parse mindmap history
    const mindmapHistory: MindmapItem[] = doc?.mindmapHistory
        ? JSON.parse(doc.mindmapHistory)
        : [];

    // Parse QA history
    const qaHistory: QAConversation[] = doc?.qAHistory
        ? JSON.parse(doc.qAHistory)
        : [];

    // Sao chép handler
    const handleCopy = () => {
        const text = getEditorText();
        if (!text) {
            toast.error("Không có nội dung để sao chép");
            return;
        }
        navigator.clipboard.writeText(text);
        toast.success("Đã coppy");
    };

    // Đọc note handler (placeholder)
    const handleReadNote = () => {
        toast.info("This feature will onboard soon");
    };
    const askAIEntireNote = () => {
        setCurrentMessages([]);
        setSelectedQAConversation(null);
        setInputValue("");
        setIsInChatMode(false);
        setQAEntireOpen(true);
    };

    // Send QA message
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

    // Open summary history modal
    const handleSummaryClick = () => {
        setSelectedSummary(null);
        setShowHistoryModal(true);
    };

    // Generate new summary
    const handleGenerateNewSummary = async () => {
        const text = getEditorText();
        if (!text || text.length < 50) {
            toast.error("Need more than 50 characters to summarize");
            return;
        }
        setLoading(true);
        try {
            // ✅ CHECK AND CONSUME AI USAGE FIRST
            await checkAndConsumeAIUsage({ amount: 1 });

            const res = await fetch("/api/tool/summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text})
            });
            if (!res.ok) throw new Error("There is an unknown error");
            const data = await res.json();
            
            // Save to database via mutation
            await addSummaryToHistory({
                id: documentId,
                summary: data.summary || "No data",
            });
            
            toast.success("Summary saved to history!");
            setSelectedSummary({
                content: data.summary || "No data",
                createdAt: Date.now(),
            });
        } catch (e: any) {
            // Check if it's a limit error
            if (e.message && e.message.includes("limit exceeded")) {
                toast.error(e.message);
            } else {
                toast.error(e.message || "There is an unknown error");
            }
        } finally {
            setLoading(false);
        }
    };

    // Open mindmap history modal
    const handleMindmap = () => {
        setSelectedMindmap(null);
        setShowMindmapModal(true);
    };

    // Generate new mindmap
    const handleGenerateNewMindmap = async () => {
        const text = getEditorText();

        if (!text || text.length < 50) {
            toast.error("Need more than 50 characters to create mindmap");
            return;
        }

        setMindmapLoading(true);

        try {
            // ✅ CHECK AND CONSUME AI USAGE FIRST
            await checkAndConsumeAIUsage({ amount: 1 });

            const res = await fetch("/api/tool/mindmap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "There is an unknown error");
            }

            const data = await res.json();

            if (!data?.mindmap || typeof data.mindmap !== "object") {
                throw new Error("Invalid mindmap data");
            }

            const mindmapObj = data.mindmap;
			const mindmapStr = JSON.stringify(mindmapObj);

			// Save to DB as stringified JSON
			await addMindmapToHistory({
				id: documentId,
				mindmap: mindmapStr,
            });

        } catch (e: any) {
            console.error(e);
            // Check if it's a limit error
            if (e.message && e.message.includes("limit exceeded")) {
                toast.error(e.message);
            } else {
                toast.error(e.message || "Failed to generate mindmap");
            }
        } finally {
            setMindmapLoading(false);
        }
    };



    return (
        <MinimizeWindowProvider>
            <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                    <ClipboardCopy className="w-4 h-4 mr-1" /> Copy Note
                </Button>
                <Button variant="outline" size="sm" onClick={handleReadNote}>
                    <BookOpen className="w-4 h-4 mr-1" /> Read note
                </Button>
                <Button variant="outline" size="sm" onClick={handleSummaryClick}>
                    <FileText className="w-4 h-4 mr-1" /> Summary
                </Button>
                <Button variant="outline" size="sm" onClick={askAIEntireNote}>
                    <BookOpen className="w-4 h-4 mr-1" /> Ask AI
                </Button>
                <MinimizeWindowButton getEditorText={getEditorText} />
                <Button variant="outline" size="sm" onClick={handleReadNote}>
                    <BookOpen className="w-4 h-4 mr-1" /> Speech mode
                </Button>

                <Button variant="outline" size="sm" onClick={handleMindmap}>
                    <Zap className="w-4 h-4 mr-1" /> Mindmap
                </Button>

                {/* Summary History Modal */}
                <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
                    <DialogContent className="dark:bg-dark max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Summary History</DialogTitle>
                        </DialogHeader>

                        {selectedSummary ? (
                            // Detail view
                            <div className="space-y-4">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedSummary(null)}
                                >
                                    ← Back to list
                                </Button>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500">
                                        {new Date(selectedSummary.createdAt).toLocaleString()}
                                    </p>
                                    <div className="whitespace-pre-line text-base min-h-[100px] p-4 bg-gray-100 dark:bg-gray-900 rounded-md overflow-y-auto">
                                        {selectedSummary.content}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // List view
                            <div className="space-y-3">
                                <Button 
                                    className="w-full"
                                    onClick={handleGenerateNewSummary}
                                    disabled={loading}
                                >
                                    {loading ? "Generating..." : "+ Generate New Summary"}
                                </Button>

                                {summaryHistory.length > 0 ? (
                                    <div className="space-y-2">
                                        {summaryHistory.map((summary, index) => (
                                            <div
                                                key={index}
                                                className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition"
                                                onClick={() => setSelectedSummary(summary)}
                                            >
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(summary.createdAt).toLocaleString()}
                                                </p>
                                                <p className="text-sm line-clamp-2 mt-1 text-gray-900 dark:text-gray-100">
                                                    {summary.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No summaries yet</p>
                                        <p className="text-sm">Generate your first summary to see it here</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Ask AI Modal */}
                <Dialog open={QAEntireOpen} onOpenChange={setQAEntireOpen}>
                    <DialogContent className="dark:bg-dark max-h-[80vh] flex flex-col w-full max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Ask AI</DialogTitle>
                        </DialogHeader>

                        {selectedQAConversation ? (
                            // View saved conversation
                            <div className="flex flex-col h-[500px]">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedQAConversation(null);
                                        setIsInChatMode(false);
                                    }}
                                    className="mb-4"
                                >
                                    ← Back to conversations
                                </Button>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                    {selectedQAConversation.messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                                                    msg.role === "user"
                                                        ? "bg-blue-500 text-white rounded-br-none"
                                                        : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none"
                                                }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    {new Date(selectedQAConversation.createdAt).toLocaleString()}
                                </p>
                            </div>
                        ) : isInChatMode ? (
                            // Current chat
                            <div className="flex flex-col h-[500px]">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setCurrentMessages([]);
                                        setInputValue("");
                                    }}
                                    className="mb-4"
                                >
                                    + New Chat
                                </Button>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                    {currentMessages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                                                    msg.role === "user"
                                                        ? "bg-blue-500 text-white rounded-br-none"
                                                        : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none"
                                                }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {qaLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
                                                <div className="flex space-x-2">
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 flex gap-2 border-t dark:border-gray-700 pt-4">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter" && !qaLoading) {
                                                handleSendQAMessage();
                                            }
                                        }}
                                        placeholder="Type your question..."
                                        disabled={qaLoading}
                                        className="flex-1 px-3 py-2 rounded-lg border dark:border-gray-700 dark:bg-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Button
                                        onClick={handleSendQAMessage}
                                        disabled={qaLoading || !inputValue.trim()}
                                        size="sm"
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // History list or start new chat
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                <Button
                                    onClick={() => setIsInChatMode(true)}
                                    className="w-full"
                                    size="lg"
                                >
                                    + Start New Chat
                                </Button>

                                {qaHistory.length > 0 && (
                                    <>
                                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-6">
                                            Chat History
                                        </div>
                                        <div className="space-y-2">
                                            {qaHistory.map((conversation, idx) => {
                                                const lastMessage = conversation.messages[conversation.messages.length - 1];
                                                const previewText = lastMessage?.content?.substring(0, 50) || "Empty conversation";
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setSelectedQAConversation(conversation)}
                                                        className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition"
                                                    >
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {new Date(conversation.createdAt).toLocaleString()}
                                                        </p>
                                                        <p className="text-sm line-clamp-2 mt-1 text-gray-900 dark:text-gray-100">
                                                            {previewText}...
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {qaHistory.length === 0 && currentMessages.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No chat history yet</p>
                                        <p className="text-sm">Start a new chat to ask questions about your note</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Mindmap History Modal */}
                <Dialog open={showMindmapModal} onOpenChange={setShowMindmapModal}>
                    <DialogContent className="dark:bg-dark max-h-[80vh] overflow-y-auto max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Mindmap History</DialogTitle>
                        </DialogHeader>

                        {selectedMindmap ? (
                            // Detail view with mindmap visualization
                            <div className="space-y-4">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedMindmap(null)}
                                >
                                    ← Back to list
                                </Button>

                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(selectedMindmap.createdAt).toLocaleString()}
                                    </p>

                                    <div className="border rounded-md overflow-hidden text-black bg-white dark:bg-zinc-900">
                                        <MindmapViewer data={selectedMindmap.content} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // List view
                            <div className="space-y-3">
                                <Button 
                                    className="w-full"
                                    onClick={handleGenerateNewMindmap}
                                    disabled={mindmapLoading}
                                >
                                    {mindmapLoading ? "Generating..." : "+ Generate New Mindmap"}
                                </Button>

                                {mindmapHistory.length > 0 ? (
                                    <div className="space-y-2">
                                        {mindmapHistory.map((mindmap, index) => (
                                            <div
                                                key={index}
                                                className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition"
                                                onClick={() => setSelectedMindmap(mindmap)}
                                            >
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(mindmap.createdAt).toLocaleString()}
                                                </p>
                                                <p className="text-sm line-clamp-2 mt-1 text-gray-900 dark:text-gray-100">
                                                    Preview: Mindmap with {Object.keys(JSON.parse(mindmap.content)).length} nodes
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No mindmaps yet</p>
                                        <p className="text-sm">Generate your first mindmap to see it here</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </MinimizeWindowProvider>
    );
};