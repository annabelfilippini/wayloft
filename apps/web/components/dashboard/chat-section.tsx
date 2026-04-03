"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Which card for dining?",
  "What perks am I missing?",
  "Transfer bonuses?",
  "Am I under 5/24?",
];

export function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasMessages = messages.length > 0 || streamingContent.length > 0;

  // Auto-scroll on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = { role: "user", content: trimmed };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);
      setStreamingContent("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedMessages }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream reader");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setStreamingContent(accumulated);
        }

        // Move completed response to messages
        if (accumulated) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: accumulated },
          ]);
        }
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Something went wrong";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, I couldn't process that. ${errMsg}`,
          },
        ]);
      } finally {
        setStreamingContent("");
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-[-0.01em] mb-6">Ask Wayloft</h2>

      {/* Suggested questions — only shown before first message */}
      {!hasMessages && (
        <div className="flex flex-wrap gap-2.5 mb-7">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={isLoading}
              className="mono text-xs px-4 py-2.5 bg-background text-muted-foreground hover:text-primary transition-colors tracking-[0.01em] disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Message area — only shown when there are messages */}
      {hasMessages && (
        <div className="max-h-[300px] overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap">
                {streamingContent}
              </div>
            </div>
          )}

          {/* Loading indicator (before stream starts) */}
          {isLoading && !streamingContent && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center bg-card p-1 pl-3.5">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your cards, points, or spending..."
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none bg-transparent text-[15px] placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 py-2.5"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="shrink-0 w-9 h-9 bg-primary flex items-center justify-center hover:brightness-110 transition-[filter] disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin text-primary-foreground" />
          ) : (
            <Send className="h-[18px] w-[18px] text-primary-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
