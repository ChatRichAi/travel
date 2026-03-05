"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThinkingChain } from "./ThinkingChain";
import { ToolPanel } from "./ToolPanel";
import { BrowserPreview } from "./BrowserPreview";
import { ConsoleOutput } from "./ConsoleOutput";

export interface SandboxStep {
  id: string;
  type: "thinking" | "tool" | "browser" | "code" | "complete";
  status: "pending" | "running" | "completed" | "error";
  title: string;
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  timestamp: number;
}

export interface SandboxData {
  steps: SandboxStep[];
  currentStepId: string | null;
  progress: number;
}

interface ManusSandboxProps {
  isActive: boolean;
  destination?: string;
  formData?: Record<string, unknown>;
  onComplete?: (itineraryId: number) => void;
  onError?: (error: string) => void;
}

// 模拟 AI 思考流程
const generateMockSteps = (destination: string): SandboxStep[] => [
  {
    id: "1",
    type: "thinking",
    status: "completed",
    title: "分析用户需求",
    content: `用户想要规划一次前往 ${destination} 的旅行。我需要先了解目的地的基本信息、热门景点、最佳旅行时间等。`,
    timestamp: Date.now(),
  },
  {
    id: "2",
    type: "tool",
    status: "completed",
    title: "搜索目的地信息",
    toolName: "search_destination",
    toolInput: { query: destination, lang: "zh" },
    toolOutput: {
      name: destination,
      bestTime: "3月-5月，9月-11月",
      popularAttractions: ["富士山", "浅草寺", "涩谷十字路口", "明治神宫"],
      climate: "温带季风气候",
    },
    timestamp: Date.now() + 1000,
  },
  {
    id: "3",
    type: "thinking",
    status: "completed",
    title: "规划行程框架",
    content: "根据目的地信息，我需要设计一个合理的行程安排。考虑到用户的出行天数和节奏偏好，我会安排：\n- Day 1: 抵达和城市初体验\n- Day 2-3: 主要景点深度游\n- Day 4: 文化体验和购物\n- Day 5: 离开前的最后游览",
    timestamp: Date.now() + 2000,
  },
  {
    id: "4",
    type: "tool",
    status: "running",
    title: "查询景点详细信息",
    toolName: "fetch_attractions",
    toolInput: { destinations: ["富士山", "浅草寺", "涩谷"] },
    timestamp: Date.now() + 3000,
  },
  {
    id: "5",
    type: "browser",
    status: "pending",
    title: "搜索当地美食推荐",
    content: "https://tabelog.com/tokyo/",
    timestamp: Date.now() + 4000,
  },
  {
    id: "6",
    type: "thinking",
    status: "pending",
    title: "优化行程安排",
    content: "根据景点位置和开放时间，优化路线规划，减少交通时间...",
    timestamp: Date.now() + 5000,
  },
  {
    id: "7",
    type: "tool",
    status: "pending",
    title: "计算交通路线",
    toolName: "calculate_routes",
    toolInput: { points: ["机场", "酒店", "富士山", "浅草寺"] },
    timestamp: Date.now() + 6000,
  },
  {
    id: "8",
    type: "code",
    status: "pending",
    title: "生成行程文档",
    content: "正在整理行程信息并生成最终方案...",
    timestamp: Date.now() + 7000,
  },
  {
    id: "9",
    type: "complete",
    status: "pending",
    title: "行程创建完成",
    timestamp: Date.now() + 8000,
  },
];

export function ManusSandbox({
  isActive,
  destination = "东京",
  formData,
  onComplete,
  onError,
}: ManusSandboxProps) {
  const [steps, setSteps] = useState<SandboxStep[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "browser" | "console">("overview");
  const [selectedStep, setSelectedStep] = useState<SandboxStep | null>(null);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 模拟步骤执行
  useEffect(() => {
    if (!isActive) {
      setSteps([]);
      setProgress(0);
      return;
    }

    const mockSteps = generateMockSteps(destination);
    setSteps(mockSteps);

    // 模拟步骤执行进度
    let currentIndex = 0;
    const interval = setInterval(() => {
      setSteps((prev) => {
        const newSteps = [...prev];
        if (currentIndex < newSteps.length) {
          // 将当前步骤标记为运行中
          if (newSteps[currentIndex].status === "pending") {
            newSteps[currentIndex].status = "running";
          }
          // 将前一个步骤标记为已完成
          if (currentIndex > 0 && newSteps[currentIndex - 1].status === "running") {
            newSteps[currentIndex - 1].status = "completed";
          }
          setSelectedStep(newSteps[currentIndex]);
        }
        return newSteps;
      });

      currentIndex++;
      setProgress(Math.min((currentIndex / mockSteps.length) * 100, 100));

      if (currentIndex >= mockSteps.length) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete?.(1); // 模拟完成的行程 ID
        }, 1000);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isActive, destination, onComplete]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  if (!isActive) return null;

  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const runningStep = steps.find((s) => s.status === "running");

  return (
    <div className="flex h-full bg-[var(--background)]">
      {/* Left Panel - Step Timeline */}
      <div className="w-80 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-brand)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">AI 行程规划师</h3>
              <p className="text-xs text-[var(--muted)]">正在为你创建行程...</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--color-brand)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            {completedSteps}/{steps.length} 步骤已完成
          </p>
        </div>

        {/* Steps List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          <AnimatePresence>
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedStep(step)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedStep?.id === step.id
                    ? "bg-[var(--color-brand-bg)] border border-[var(--color-brand)]"
                    : "hover:bg-[var(--color-brand-bg)] border border-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="mt-0.5">
                    {step.status === "pending" && (
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--border)]" />
                    )}
                    {step.status === "running" && (
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin" />
                    )}
                    {step.status === "completed" && (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-brand)] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      step.status === "pending" ? "text-[var(--muted)]" : "text-[var(--foreground)]"
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {step.type === "thinking" && "💭 思考"}
                      {step.type === "tool" && `🔧 ${step.toolName}`}
                      {step.type === "browser" && "🌐 浏览器"}
                      {step.type === "code" && "💻 代码"}
                      {step.type === "complete" && "✅ 完成"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Panel - Detail View */}
      <div className="flex-1 flex flex-col">
        {/* Tab Bar */}
        <div className="flex items-center gap-1 p-2 border-b border-[var(--border)]">
          {[
            { key: "overview", label: "概览", icon: "📋" },
            { key: "browser", label: "浏览器", icon: "🌐" },
            { key: "console", label: "控制台", icon: "🖥️" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-[var(--color-brand)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--color-brand-bg)]"
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "overview" && (
            <div className="h-full overflow-y-auto p-6">
              {runningStep && runningStep.type === "thinking" && (
                <ThinkingChain content={runningStep.content || ""} isThinking={true} />
              )}
              {selectedStep?.type === "tool" && (
                <ToolPanel step={selectedStep} />
              )}
              {selectedStep?.type === "browser" && (
                <BrowserPreview url={selectedStep.content || ""} />
              )}
              {selectedStep?.type === "code" && (
                <ConsoleOutput logs={[{ type: "info", message: selectedStep.content || "" }]} />
              )}
              {!selectedStep && (
                <div className="flex h-full items-center justify-center text-[var(--muted)]">
                  选择一个步骤查看详细信息
                </div>
              )}
            </div>
          )}
          
          {activeTab === "browser" && (
            <BrowserPreview url={runningStep?.type === "browser" ? runningStep.content || "" : "https://www.google.com/search?q=" + destination} />
          )}
          
          {activeTab === "console" && (
            <ConsoleOutput
              logs={steps
                .filter((s) => s.status !== "pending")
                .map((s) => ({
                  type: s.status === "error" ? "error" : "info",
                  message: `[${s.type.toUpperCase()}] ${s.title}`,
                  timestamp: s.timestamp,
                }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
