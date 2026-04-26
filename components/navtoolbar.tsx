"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClipboardCopy, BookOpen, FileText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Helper to get all text from the editor
function getEditorText() {
    const blocks = document.querySelectorAll('[data-node-type="blockOuter"]');

    return Array.from(blocks)
        .map(b => b.textContent.trim())
        .filter(Boolean)
        .join("\n");
}



export function NavToolbar() {
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [summaryText, setSummaryText] = useState("");
    const [QAEntireOpen, setQAEntireOpen] = useState(false);
    const [loading, setLoading] = useState(false);

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
        setQAEntireOpen(true);
    };

    // Summary handler
    const handleSummary = async () => {
        const text = getEditorText();
        if (!text || text.length < 50) {
            toast.error("Cần viết dài hơn 50 ký tự để tóm tắt");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/tool/summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, prompt: "Tóm tắt nội dung sau bằng tiếng Việt, ngắn gọn, súc tích, dễ hiểu cho người mới bắt đầu:" })
            });
            if (!res.ok) throw new Error("Lỗi khi gọi API");
            const data = await res.json();
            setSummaryText(data.summary || "Không có dữ liệu");
            setSummaryOpen(true);
        } catch (e) {
            toast.error("Lỗi khi tóm tắt");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleCopy}>
                <ClipboardCopy className="w-4 h-4 mr-1" /> Sao chép
            </Button>
            <Button variant="outline" size="sm" onClick={handleReadNote}>
                <BookOpen className="w-4 h-4 mr-1" /> Đọc note
            </Button>
            <Button variant="outline" size="sm" onClick={handleSummary} disabled={loading}>
                <FileText className="w-4 h-4 mr-1" /> {loading ? "Summarizing..." : "Summary"}
            </Button>
            <Button variant="outline" size="sm" onClick={askAIEntireNote}>
                <BookOpen className="w-4 h-4 mr-1" /> Ask AI
            </Button>
            <Button variant="outline" size="sm" onClick={handleReadNote}>
                <BookOpen className="w-4 h-4 mr-1" /> Đọc note
            </Button>

            <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
                <DialogContent className="dark:bg-dark max-h-[80vh] overflow-y-auto " >
                    <DialogHeader>
                    <DialogTitle>Tóm tắt nội dung</DialogTitle>
                    </DialogHeader>

                    <div className="whitespace-pre-line text-base min-h-[60px] overflow-y-auto pr-2">
                    {summaryText}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={QAEntireOpen} onOpenChange={setQAEntireOpen}>
                <DialogContent className="dark:bg-dark max-h-[80vh] overflow-y-auto " >
                    <DialogHeader>
                    <DialogTitle>Ask AI</DialogTitle>
                    </DialogHeader>

                    <div className="whitespace-pre-line text-base min-h-[60px] overflow-y-auto pr-2">
                    <p>Xin chào</p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}