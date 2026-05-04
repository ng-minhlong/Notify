"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, MessageSquare, History } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface QAConversation {
  messages: ChatMessage[];
  createdAt: number;
}

interface QASidebarProps {
  isOpen: boolean;
  onClose: () => void;
  qaHistory: QAConversation[];
  currentMessages: ChatMessage[];
  setCurrentMessages: (messages: ChatMessage[]) => void;
  selectedQAConversation: QAConversation | null;
  setSelectedQAConversation: (conv: QAConversation | null) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  qaLoading: boolean;
  onSendMessage: () => void;
  documentId: string;
}

export function QASidebar({
  isOpen,
  onClose,
  qaHistory,
  currentMessages,
  setCurrentMessages,
  selectedQAConversation,
  setSelectedQAConversation,
  inputValue,
  setInputValue,
  qaLoading,
  onSendMessage,
  documentId,
}: QASidebarProps) {
  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setCurrentMessages([]);
    setSelectedQAConversation(null);
    setInputValue("");
  };

  return (
    <div className={`fixed z-50 right-0 top-0 left-0 w-full h-[30vh] md:left-auto md:w-96 md:h-screen bg-background border border-border shadow-lg transition-transform duration-300 ease-in-out md:border-l ${
      isOpen ? "translate-x-0 translate-y-0" : "translate-y-full md:translate-x-full md:translate-y-0"
    }`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ask AI</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col p-4 space-y-4">
          <Button variant="outline" onClick={startNewChat}>
            New Chat
          </Button>

          {currentMessages.length === 0 && !selectedQAConversation && (
            <div className="flex-1 flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="Notify Logo"
                width={120}
                height={120}
                className="opacity-50"
              />
            </div>
          )}

          {currentMessages.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {currentMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground ml-8"
                        : "bg-muted mr-8"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              disabled={qaLoading}
            />
            <Button onClick={handleSend} disabled={qaLoading || !inputValue.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 p-4">
          <div className="h-full overflow-y-auto">
            <div className="space-y-2">
              {qaHistory.map((conv, index) => (
                <div
                  key={index}
                  className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() => setSelectedQAConversation(conv)}
                >
                  <p className="text-sm font-medium">
                    {conv.messages[0]?.content.slice(0, 50)}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conv.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {selectedQAConversation && (
        <div className="absolute inset-0 bg-background p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold">Conversation Details</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedQAConversation(null)}>
              ✕
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {selectedQAConversation.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-8"
                      : "bg-muted mr-8"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}