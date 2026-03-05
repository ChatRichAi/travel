"use client";

import { motion } from "framer-motion";

interface ThinkingChainProps {
  content: string;
  isThinking?: boolean;
}

export function ThinkingChain({ content, isThinking = false }: ThinkingChainProps) {
  const lines = content.split("\n").filter((line) => line.trim());

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">AI 思考过程</h2>
          <p className="text-sm text-[var(--muted)]">
            {isThinking ? "正在分析..." : "思考完成"}
          </p>
        </div>
      </div>

      {/* Thinking Lines */}
      <div className="space-y-3">
        {lines.map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            {/* Step Number */}
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-[var(--color-brand-bg)] border border-[var(--color-brand)] flex items-center justify-center text-xs font-medium text-[var(--color-brand)]">
                {index + 1}
              </div>
              {index < lines.length - 1 && (
                <div className="w-0.5 flex-1 bg-[var(--border)] my-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="text-[var(--text)] leading-relaxed"
              >
                {line}
              </motion.p>
            </div>
          </motion.div>
        ))}

        {/* Thinking Indicator */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-6 h-6 rounded-full bg-[var(--color-brand)] flex items-center justify-center">
              <motion.div
                className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="flex items-center gap-1">
              <motion.span
                className="w-2 h-2 bg-[var(--color-brand)] rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
              />
              <motion.span
                className="w-2 h-2 bg-[var(--color-brand)] rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
              />
              <motion.span
                className="w-2 h-2 bg-[var(--color-brand)] rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
