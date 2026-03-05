"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SandboxStep } from "./ManusSandbox";

interface ToolPanelProps {
  step: SandboxStep;
}

export function ToolPanel({ step }: ToolPanelProps) {
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">工具调用</h2>
          <p className="text-sm text-[var(--muted)]">{step.toolName}</p>
        </div>
        <div className="ml-auto">
          {step.status === "running" && (
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium animate-pulse">
              执行中
            </span>
          )}
          {step.status === "completed" && (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              已完成
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("input")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "input"
              ? "bg-[var(--color-brand-bg)] text-[var(--color-brand)] border border-[var(--color-brand)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--color-brand-bg)]"
          }`}
        >
          输入参数
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "output"
              ? "bg-[var(--color-brand-bg)] text-[var(--color-brand)] border border-[var(--color-brand)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--color-brand-bg)]"
          }`}
        >
          返回结果
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1a2e] rounded-xl overflow-hidden"
      >
        {/* Code Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#252542]">
          <span className="text-xs text-gray-400">
            {activeTab === "input" ? "Input Parameters" : "Output Result"}
          </span>
          <span className="text-xs text-gray-500">JSON</span>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono leading-relaxed">
            <code className="text-green-400">
              {JSON.stringify(
                activeTab === "input" ? step.toolInput : step.toolOutput,
                null,
                2
              )}
            </code>
          </pre>
        </div>
      </motion.div>

      {/* Tool Description */}
      <div className="mt-6 p-4 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">工具说明</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          {step.toolName === "search_destination" && "搜索目的地的基本信息，包括最佳旅行时间、热门景点、气候等。"}
          {step.toolName === "fetch_attractions" && "获取指定景点的详细信息，包括开放时间、门票价格、游览建议等。"}
          {step.toolName === "calculate_routes" && "计算多个地点之间的最优路线，包括交通方式和时间估算。"}
          {!step.toolName && "执行特定的工具调用以获取或处理数据。"}
        </p>
      </div>
    </div>
  );
}
