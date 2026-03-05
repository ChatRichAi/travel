"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface LogEntry {
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp?: number;
}

interface ConsoleOutputProps {
  logs: LogEntry[];
}

const typeColors = {
  info: "text-blue-400",
  success: "text-green-400",
  warning: "text-yellow-400",
  error: "text-red-400",
};

const typePrefixes = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  error: "✗",
};

export function ConsoleOutput({ logs }: ConsoleOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-[#0d0d15]">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-gray-800">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-gray-400 font-mono">Console</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{logs.length} logs</span>
        </div>
      </div>

      {/* Console Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-gray-600 text-center py-8">等待执行...</div>
        ) : (
          logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-2"
            >
              <span className={typeColors[log.type]}>{typePrefixes[log.type]}</span>
              <span className="text-gray-500">{new Date(log.timestamp || Date.now()).toLocaleTimeString()}</span>
              <span className={`${typeColors[log.type]} flex-1 break-all`}>{log.message}</span>
            </motion.div>
          ))
        )}
        
        {/* Cursor */}
        <motion.span
          className="inline-block w-2 h-4 bg-[var(--color-brand)] ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </div>

      {/* Console Footer */}
      <div className="px-4 py-2 bg-[#1a1a2e] border-t border-gray-800">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Filter:</span>
          <button className="hover:text-gray-300 transition-colors">All</button>
          <button className="hover:text-gray-300 transition-colors">Info</button>
          <button className="hover:text-gray-300 transition-colors">Warnings</button>
          <button className="hover:text-gray-300 transition-colors">Errors</button>
        </div>
      </div>
    </div>
  );
}
