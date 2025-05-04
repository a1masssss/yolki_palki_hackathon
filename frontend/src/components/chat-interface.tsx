"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, AlertCircle } from "lucide-react";
import { useChat } from "@ai-sdk/react";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
}
// Define a custom error type that might include a response
interface ApiError extends Error {
  response?: {
    status: number;
    data: any;
  };
}

export default function ChatInterface({ summary }: { summary: string }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { messages, input, handleInputChange, handleSubmit } = useChat({});

  const formatTime = (date: string | Date) => {
    if (typeof date === "string") {
      return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChatError(null); // Clear previous errors
    setIsProcessing(true);

    try {
      handleSubmit(e);
    } catch (error) {
      console.error("Form submission error:", error);
      setChatError("Failed to send message. Please try again.");
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-md bg-white dark:bg-slate-900">
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex mb-4 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role !== "user" && (
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                  AI
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-rose-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <p>{message.content}</p>
              <div
                className={`text-xs mt-1 ${
                  message.role === "user" ? "text-rose-100" : "text-slate-500"
                }`}
              >
                {message.createdAt
                  ? formatTime(message.createdAt)
                  : formatTime(new Date())}
              </div>
            </div>

            {message.role === "user" && (
              <Avatar className="h-8 w-8 ml-2">
                <AvatarFallback className="bg-rose-100 text-rose-700">
                  ME
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {chatError && (
        <div className="px-3 py-2 bg-red-50 border-t border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mr-2" />
            <p className="text-sm">{chatError}</p>
          </div>
          <button
            onClick={() => setChatError(null)}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="p-3 border-t">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-grow"
          />
          <Button
            type="submit"
            size="icon"
            className="bg-rose-500 hover:bg-rose-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {isProcessing && (
          <div className="text-xs text-slate-500 mt-2">AI is thinking...</div>
        )}
      </div>
    </div>
  );
}
