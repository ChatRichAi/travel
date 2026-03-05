"use client";

import { motion } from "framer-motion";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
  isTyping?: boolean;
}

export function ChatMessage({ content, isUser, timestamp, isTyping }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[80%] ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`}>
        {isTyping ? (
          <div className="flex items-center gap-1 h-6 px-2">
            <span className="w-2 h-2 rounded-full bg-current opacity-40 typing-dot" />
            <span className="w-2 h-2 rounded-full bg-current opacity-40 typing-dot" />
            <span className="w-2 h-2 rounded-full bg-current opacity-40 typing-dot" />
          </div>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{content}</p>
            {timestamp && (
              <span className={`text-xs mt-2 block ${isUser ? "text-white/70" : "text-[var(--muted)]"}`}>
                {timestamp}
              </span>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
