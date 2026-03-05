"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@arco-design/web-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  disabled,
  placeholder = "输入消息...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 focus-within:border-[var(--color-brand)] focus-within:ring-1 focus-within:ring-[var(--color-brand)] dark:border-gray-600 dark:bg-gray-800">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          />
        </div>
        <Button
          type="primary"
          shape="circle"
          size="large"
          disabled={!value.trim() || disabled}
          onClick={handleSend}
          className="!bg-[var(--color-brand)] !border-[var(--color-brand)] hover:!bg-[var(--color-brand-dark)] disabled:!bg-gray-300"
          icon={<FontAwesomeIcon icon={faPaperPlane} />}
        />
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-gray-400">
        按 Enter 发送，Shift + Enter 换行
      </p>
    </div>
  );
}
