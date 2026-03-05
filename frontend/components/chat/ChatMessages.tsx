"use client";

import { useEffect, useRef } from "react";
import { Empty } from "@arco-design/web-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faUser } from "@fortawesome/free-solid-svg-icons";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatMessagesProps {
  messages: Message[];
  loading?: boolean;
  streaming?: boolean;
  streamContent?: string;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-[var(--color-brand)] text-white"
            : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        <FontAwesomeIcon icon={isUser ? faUser : faRobot} className="text-xs" />
      </div>

      {/* Content */}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-[var(--color-brand)] text-white"
            : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
        <div
          className={`mt-1 text-xs ${
            isUser ? "text-white/60" : "text-gray-400"
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

export default function ChatMessages({
  messages,
  loading,
  streaming,
  streamContent,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-bg)]">
            <FontAwesomeIcon
              icon={faRobot}
              className="text-2xl text-[var(--color-brand)]"
            />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            我的家 AI 助手
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            您好！我是您的旅行定制助手，有什么可以帮您？
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming message */}
        {streaming && streamContent && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              <FontAwesomeIcon icon={faRobot} className="text-xs" />
            </div>
            <div className="max-w-[70%] rounded-2xl bg-gray-100 px-4 py-2.5 dark:bg-gray-800">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-gray-100">
                {streamContent}
                <span className="inline-block h-4 w-1 animate-pulse bg-[var(--color-brand)]" />
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <FontAwesomeIcon icon={faRobot} className="text-xs text-gray-600 dark:text-gray-300" />
            </div>
            <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
