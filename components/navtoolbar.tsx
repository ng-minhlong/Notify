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
import { useSpeechMode } from "@/hooks/useSpeechMode";

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

interface NavToolbarProps {
    askAIEntireNote?: () => void;
}

export function NavToolbar({ askAIEntireNote }: NavToolbarProps) {
    const params = useParams();
    const documentId = params?.documentId as Id<"documents">;
    
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedSummary, setSelectedSummary] = useState<SummaryItem | null>(null);
    const [showMindmapModal, setShowMindmapModal] = useState(false);
    const [selectedMindmap, setSelectedMindmap] = useState<MindmapItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [mindmapLoading, setMindmapLoading] = useState(false);
    const speechMode = useSpeechMode();

    // Fetch document to get summary history
    const doc = useQuery(api.documents.getById, {
        documentId: documentId,
    });

    // Mutation to add summary to history
    const addSummaryToHistory = useMutation(api.documents.addSummaryToHistory);
    // Mutation to add mindmap to history
    const addMindmapToHistory = useMutation(api.documents.addMindmapToHistory);
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
    const handleAskAI = () => {
        if (askAIEntireNote) {
            askAIEntireNote();
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
            <div className="flex gap-2 mb-4 max-w-full overflow-x-auto pb-2 whitespace-nowrap scrollbar-hide">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                    <ClipboardCopy className="w-4 h-4 mr-1" /> Copy Note
                </Button>
                <Button variant="outline" size="sm" onClick={handleReadNote}>
                    <BookOpen className="w-4 h-4 mr-1" /> Read note
                </Button>
                <Button variant="outline" size="sm" onClick={handleSummaryClick}>
                    <FileText className="w-4 h-4 mr-1" /> Summary
                </Button>
                <Button variant="outline" size="sm" onClick={handleAskAI}>
                    <BookOpen className="w-4 h-4 mr-1" /> Ask AI
                </Button>
                <MinimizeWindowButton getEditorText={getEditorText} />
                <Button variant="outline" size="sm" onClick={speechMode.onOpen} >
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