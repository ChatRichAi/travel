"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ onSend, placeholder = "输入消息...", disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      onSubmit={handleSubmit}
      className="relative"
    >
      <div className="relative flex items-center bg-[var(--surface)] rounded-full border border-[var(--border)] shadow-[var(--shadow-md)] focus-within:border-[var(--color-brand)] focus-within:shadow-[0_0_0_3px_rgba(195,176,125,0.15)] transition-all duration-200">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent px-6 py-4 text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none text-[15px]"
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="mr-2 w-10 h-10 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-brand-light)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-brand)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </motion.form>
  );
}
