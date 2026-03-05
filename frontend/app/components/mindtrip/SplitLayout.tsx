"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SplitLayoutProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  leftWidth?: string;
  rightWidth?: string;
}

export function SplitLayout({
  leftContent,
  rightContent,
  leftWidth = "50%",
  rightWidth = "50%",
}: SplitLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="h-full overflow-y-auto hide-scrollbar"
        style={{ width: leftWidth }}
      >
        {leftContent}
      </motion.div>

      {/* Right Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        className="h-full sticky top-0"
        style={{ width: rightWidth }}
      >
        {rightContent}
      </motion.div>
    </div>
  );
}
