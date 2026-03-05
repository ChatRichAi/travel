"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faUsers,
  faMapPin,
  faRoute,
  faClipboardList,
  faMoneyBill,
  faMoneyBillTransfer,
  faFileContract,
  faShieldAlt,
  faFolder,
  faUsersCog,
  faFileInvoice,
  faCreditCard,
  faExchangeAlt,
  faHandHoldingDollar,
  faChartBar,
  faListCheck,
  faMobileScreen,
  faGear,
  faBookOpen,
  faChevronLeft,
  faChevronRight,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions";
import type { Role } from "@/types";

/** Navigation item definition */
interface NavItem {
  label: string;
  href: string;
  icon: IconDefinition;
  roles: Role[];
}

/** All navigation items with role-based access */
const navItems: NavItem[] = [
  // Shared
  { label: "对话", href: "/chat", icon: faComments, roles: ["admin", "sales", "planner", "finance", "operation"] },

  // Sales
  { label: "团队", href: "/team", icon: faUsers, roles: ["admin", "sales"] },
  { label: "POI", href: "/poi", icon: faMapPin, roles: ["admin", "sales"] },
  { label: "行程", href: "/itinerary", icon: faRoute, roles: ["admin", "sales", "planner"] },
  { label: "方案库", href: "/plan-library", icon: faBookOpen, roles: ["admin", "sales", "planner"] },
  { label: "订单", href: "/order", icon: faClipboardList, roles: ["admin", "sales"] },
  { label: "销售付款", href: "/sales-payment/pay", icon: faMoneyBill, roles: ["admin", "sales"] },
  { label: "销售收款", href: "/sales-payment/receive", icon: faMoneyBillTransfer, roles: ["admin", "sales"] },
  { label: "合同", href: "/contract", icon: faFileContract, roles: ["admin", "sales"] },
  { label: "保险", href: "/insurance", icon: faShieldAlt, roles: ["admin", "sales"] },
  { label: "素材库", href: "/materials", icon: faFolder, roles: ["admin", "sales", "operation"] },

  // Planner
  { label: "团队管理", href: "/team-management", icon: faUsersCog, roles: ["admin", "planner"] },
  { label: "计调付款", href: "/planner-payment/pay", icon: faMoneyBill, roles: ["admin", "planner"] },
  { label: "计调收款", href: "/planner-payment/receive", icon: faMoneyBillTransfer, roles: ["admin", "planner"] },
  { label: "发票管理", href: "/finance/invoice-management", icon: faFileInvoice, roles: ["admin", "planner"] },

  // Finance
  { label: "付款管理", href: "/payment", icon: faCreditCard, roles: ["admin", "finance"] },
  { label: "地接对账", href: "/local-agent-payment/reconcile", icon: faExchangeAlt, roles: ["admin", "finance"] },
  { label: "客户收款", href: "/customer-collection", icon: faHandHoldingDollar, roles: ["admin", "finance"] },
  { label: "供应商付款", href: "/supplier-payment", icon: faMoneyBill, roles: ["admin", "finance"] },
  { label: "总付款", href: "/finance/total-payments", icon: faChartBar, roles: ["admin", "finance"] },
  { label: "付款记录", href: "/finance/payment-records", icon: faListCheck, roles: ["admin", "finance"] },

  // Operation
  { label: "微信文章", href: "/wechat-articles", icon: faMobileScreen, roles: ["admin", "operation"] },
  { label: "设置", href: "/settings", icon: faGear, roles: ["admin", "operation"] },
];

/** Role display labels */
const roleLabels: Record<Role, string> = {
  admin: "管理员",
  sales: "销售",
  planner: "计调",
  finance: "财务",
  operation: "运营",
};

/** Role badge colors */
const roleBadgeColors: Record<Role, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  sales: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  planner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  finance: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  operation: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { hasRole } = usePermissions();

  /** Filter nav items based on user role */
  const visibleItems = navItems.filter((item) => {
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  });

  /** Check if a nav item is active */
  const isActive = (href: string) => {
    if (href === "/chat") return pathname === "/chat";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Redirect happens via interceptor
    }
  };

  return (
    <aside
      className={`
        relative flex flex-col h-full
        border-r border-gray-200 dark:border-gray-800
        bg-white dark:bg-gray-950
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[68px]" : "w-[240px]"}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand text-white font-bold text-lg shrink-0">
          家
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold text-brand-dark dark:text-brand-light whitespace-nowrap overflow-hidden">
            我的家
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200 group
                ${active
                  ? "bg-brand/15 text-brand-dark dark:text-brand-light font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200"
                }
              `}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className={`
                  w-4 h-4 shrink-0
                  ${active
                    ? "text-brand dark:text-brand-light"
                    : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  }
                `}
              />
              {!collapsed && (
                <span className="text-sm whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
              {active && (
                <div className="absolute left-0 w-[3px] h-6 rounded-r-full bg-brand" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="
          absolute -right-3 top-20
          w-6 h-6 rounded-full
          flex items-center justify-center
          bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-700
          text-gray-400 hover:text-brand
          shadow-sm cursor-pointer
          transition-colors duration-200
          z-10
        "
        title={collapsed ? "展开侧栏" : "收起侧栏"}
      >
        <FontAwesomeIcon
          icon={collapsed ? faChevronRight : faChevronLeft}
          className="w-2.5 h-2.5"
        />
      </button>

      {/* User info & logout */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 shrink-0">
        {user && (
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-semibold text-sm shrink-0">
              {user.name?.charAt(0) || "U"}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name}
                </p>
                <span
                  className={`
                    inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded
                    ${roleBadgeColors[user.role] || "bg-gray-100 text-gray-600"}
                  `}
                >
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={handleLogout}
                className="
                  p-1.5 rounded-md
                  text-gray-400 hover:text-red-500
                  hover:bg-red-50 dark:hover:bg-red-900/20
                  transition-colors duration-200
                  cursor-pointer
                "
                title="退出登录"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {collapsed && user && (
          <button
            onClick={handleLogout}
            className="
              mt-2 w-full flex items-center justify-center
              p-1.5 rounded-md
              text-gray-400 hover:text-red-500
              hover:bg-red-50 dark:hover:bg-red-900/20
              transition-colors duration-200
              cursor-pointer
            "
            title="退出登录"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
