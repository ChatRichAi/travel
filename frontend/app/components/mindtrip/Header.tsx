"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface HeaderProps {
  userName?: string;
  userAvatar?: string;
}

export function Header({ userName, userAvatar }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]"
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand)] flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="text-[var(--foreground)] font-semibold text-lg">
            Travel Planner
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {["首页", "行程", "探索", "收藏"].map((item, i) => (
            <Link
              key={item}
              href="#"
              className="px-4 py-2 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--color-brand-bg)] transition-all duration-200"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3">
          <button className="btn-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </button>

          {userName ? (
            <div className="flex items-center gap-2 pl-3 border-l border-[var(--border)]">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white font-medium text-sm">
                  {userName.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-[var(--foreground)] hidden sm:block">
                {userName}
              </span>
            </div>
          ) : (
            <button className="px-4 py-2 rounded-full bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-light)] transition-colors">
              登录
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
