"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSun,
  faMoon,
  faBell,
  faChevronDown,
  faGear,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth";
import { useThemeStore } from "@/stores/theme";
import type { Role } from "@/types";

/** Route to page title mapping */
const routeTitles: Record<string, string> = {
  "/chat": "AI 对话",
  "/team": "团队",
  "/poi": "POI 景点",
  "/itinerary": "行程管理",
  "/order": "订单管理",
  "/sales-payment/pay": "销售付款",
  "/sales-payment/receive": "销售收款",
  "/planner-payment/pay": "计调付款",
  "/planner-payment/receive": "计调收款",
  "/contract": "合同管理",
  "/insurance": "保险管理",
  "/materials": "素材库",
  "/payment": "付款管理",
  "/local-agent-payment/reconcile": "地接对账",
  "/customer-collection": "客户收款",
  "/supplier-payment": "供应商付款",
  "/finance/invoice-management": "发票管理",
  "/finance/total-payments": "总付款",
  "/finance/payment-records": "付款记录",
  "/team-management": "团队管理",
  "/wechat-articles": "微信文章",
  "/settings": "系统设置",
  "/settings/contract_subject": "合同主体",
  "/settings/order_info": "订单信息配置",
  "/settings/payment_methods": "付款方式",
  "/settings/miniprogram": "小程序配置",
};

/** Role display labels */
const roleLabels: Record<Role, string> = {
  admin: "管理员",
  sales: "销售",
  planner: "计调",
  finance: "财务",
  operation: "运营",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /** Resolve page title from current pathname */
  const pageTitle = (() => {
    // Try exact match first
    if (routeTitles[pathname]) return routeTitles[pathname];
    // Try prefix match (longest first)
    const matches = Object.keys(routeTitles)
      .filter((route) => pathname.startsWith(route))
      .sort((a, b) => b.length - a.length);
    return matches.length > 0 ? routeTitles[matches[0]] : "我的家定制游";
  })();

  /** Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
    } catch {
      // Redirect happens via interceptor
    }
  };

  return (
    <header className="
      flex items-center justify-between h-16 px-6
      bg-white dark:bg-gray-950
      border-b border-gray-200 dark:border-gray-800
      shrink-0
    ">
      {/* Left: Page title */}
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
        {pageTitle}
      </h1>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="
            w-9 h-9 rounded-lg flex items-center justify-center
            text-gray-500 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors duration-200
            cursor-pointer
          "
          title={theme === "light" ? "切换至深色模式" : "切换至浅色模式"}
        >
          <FontAwesomeIcon
            icon={theme === "light" ? faMoon : faSun}
            className="w-4 h-4"
          />
        </button>

        {/* Notification bell */}
        <button
          className="
            relative w-9 h-9 rounded-lg flex items-center justify-center
            text-gray-500 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors duration-200
            cursor-pointer
          "
          title="通知"
        >
          <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
          {/* Notification badge placeholder */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="
              flex items-center gap-2 px-2 py-1.5 rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors duration-200
              cursor-pointer
            "
          >
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-semibold text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
              {user?.name || "用户"}
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`
                w-3 h-3 text-gray-400
                transition-transform duration-200
                ${dropdownOpen ? "rotate-180" : ""}
              `}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="
              absolute right-0 top-full mt-1 w-56
              bg-white dark:bg-gray-900
              border border-gray-200 dark:border-gray-700
              rounded-xl shadow-lg
              py-1 z-50
              animate-in fade-in slide-in-from-top-2 duration-200
            ">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {user?.email}
                </p>
                {user?.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded bg-brand/10 text-brand-dark dark:text-brand-light">
                    {roleLabels[user.role] || user.role}
                  </span>
                )}
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/settings");
                  }}
                  className="
                    w-full flex items-center gap-3 px-4 py-2
                    text-sm text-gray-700 dark:text-gray-300
                    hover:bg-gray-50 dark:hover:bg-gray-800
                    transition-colors duration-150
                    cursor-pointer
                  "
                >
                  <FontAwesomeIcon icon={faGear} className="w-3.5 h-3.5 text-gray-400" />
                  系统设置
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                <button
                  onClick={handleLogout}
                  className="
                    w-full flex items-center gap-3 px-4 py-2
                    text-sm text-red-600 dark:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-900/20
                    transition-colors duration-150
                    cursor-pointer
                  "
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="w-3.5 h-3.5" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
