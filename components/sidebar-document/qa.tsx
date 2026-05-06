"use client";

import Image from "next/image";
import { History, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface QAConversation {
  messages: ChatMessage[];
  createdAt: number;
}

interface DocumentSidebarQAProps {
  qaHistory: QAConversation[];
  currentMessages: ChatMessage[];
  setCurrentMessages: (messages: ChatMessage[]) => void;
  selectedQAConversation: QAConversation | null;
  setSelectedQAConversation: (conversation: QAConversation | null) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  qaLoading: boolean;
  onSendMessage: () => void;
}

export function DocumentSidebarQA({
  qaHistory,
  currentMessages,
  setCurrentMessages,
  selectedQAConversation,
  setSelectedQAConversation,
  inputValue,
  setInputValue,
  qaLoading,
  onSendMessage,
}: DocumentSidebarQAProps) {
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
    <Tabs defaultValue="chat" className="relative flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">Ask AI</h2>
      </div>

      <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
        <TabsTrigger value="chat" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Chat
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="mt-4 flex min-h-0 flex-1 flex-col px-4 pb-4">
       

        {currentMessages.length === 0 && !selectedQAConversation ? (
          <div className="flex flex-1 items-center justify-center">
            <Image
              src="/logo.svg"
              alt="Notify Logo"
              width={120}
              height={120}
              className="opacity-50"
            />
          </div>
        ) : (
          <div className="mt-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {currentMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 ${
                    msg.role === "user"
                      ? "ml-8 bg-primary text-primary-foreground"
                      : "mr-8 bg-muted"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask a question..."
            disabled={qaLoading}
          />
          <Button onClick={handleSend} disabled={qaLoading || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="history" className="mt-4 min-h-0 flex-1 px-4 pb-4">
        <div className="h-full overflow-y-auto">
          <div className="space-y-2">
            {qaHistory.map((conversation, index) => (
              <div
                key={index}
                className="cursor-pointer rounded-lg border border-border p-3 transition hover:bg-muted"
                onClick={() => setSelectedQAConversation(conversation)}
              >
                <p className="text-sm font-medium">
                  {conversation.messages[0]?.content.slice(0, 50)}...
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(conversation.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      {selectedQAConversation ? (
        <div className="absolute inset-0 z-10 flex min-h-0 flex-col bg-background p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-md font-semibold">Conversation Details</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedQAConversation(null)}
            >
              X
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {selectedQAConversation.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 ${
                    msg.role === "user"
                      ? "ml-8 bg-primary text-primary-foreground"
                      : "mr-8 bg-muted"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Tabs>
  );
}
