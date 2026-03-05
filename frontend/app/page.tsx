"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotate,
  faDatabase,
  faChartLine,
  faCloud,
} from "@fortawesome/free-solid-svg-icons";

const features = [
  {
    icon: faRotate,
    title: "全生命周期支持",
    description: "从设计到部署，质量保证",
  },
  {
    icon: faDatabase,
    title: "数据采集能力",
    description: "多源数据聚合，智能决策",
  },
  {
    icon: faChartLine,
    title: "完整SLA监控",
    description: "基于OpenTelemetry的全栈可观测",
  },
  {
    icon: faCloud,
    title: "多云调度",
    description: "云端访问，专线加速海外AI服务",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)] transition-colors duration-200">
      {/* Subtle dot grid background */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--color-brand) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)]">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">
            我的家定制游
          </span>
        </div>
        <Link
          href="/login"
          className="rounded-xl bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[var(--color-brand-hover)] hover:shadow-lg"
        >
          登录
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 sm:px-12">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <span className="mb-6 inline-block rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand-bg)] px-4 py-1.5 text-xs font-medium text-[var(--color-brand-dark)] tracking-wide">
              AI-Powered Travel Platform
            </span>
          </motion.div>

          <motion.h1
            className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            variants={itemVariants}
          >
            <span className="text-[var(--color-brand)]">我的家</span>定制游
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed opacity-60 sm:text-xl"
            variants={itemVariants}
          >
            现代化的 AI 应用平台
          </motion.p>

          <motion.div className="mt-10" variants={itemVariants}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-brand)] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[var(--color-brand-hover)] hover:shadow-xl hover:-translate-y-0.5"
            >
              立即登录
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="mx-auto mt-24 grid w-full max-w-5xl grid-cols-1 gap-6 pb-20 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              className="group rounded-2xl border border-[var(--color-brand)]/10 bg-[var(--color-brand-bg)] p-6 transition-all hover:border-[var(--color-brand)]/30 hover:shadow-lg"
              variants={itemVariants}
              whileHover={{ y: -4 }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)] transition-colors group-hover:bg-[var(--color-brand)] group-hover:text-white">
                <FontAwesomeIcon icon={feature.icon} className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed opacity-50">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--color-brand)]/10 py-8 text-center">
        <p className="text-xs opacity-30">
          &copy; {new Date().getFullYear()} 我的家定制游. All rights reserved.
        </p>
        <p className="mt-1 text-xs opacity-20">
          蜀ICP备19004706号-4
        </p>
      </footer>
    </div>
  );
}
