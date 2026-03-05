"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileContract,
  faClipboardList,
  faCreditCard,
  faMobileScreen,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface SettingCard {
  title: string;
  description: string;
  icon: IconDefinition;
  href: string;
  color: string;
}

const settingCards: SettingCard[] = [
  {
    title: "合同主体管理",
    description: "管理公司合同签署主体信息，包括名称、代码、联系方式等",
    icon: faFileContract,
    href: "/settings/contract_subject",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  },
  {
    title: "订单信息配置",
    description: "配置订单标签、分类标记，方便订单分类管理",
    icon: faClipboardList,
    href: "/settings/order_info",
    color:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  },
  {
    title: "付款方式管理",
    description: "管理银行、支付宝、微信等付款收款渠道信息",
    icon: faCreditCard,
    href: "/settings/payment_methods",
    color:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  },
  {
    title: "小程序配置",
    description: "配置微信小程序的 AppID、密钥等参数信息",
    icon: faMobileScreen,
    href: "/settings/miniprogram",
    color:
      "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          系统设置
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          管理系统各项配置
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5">
        {settingCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="
              group flex flex-col gap-4 p-6
              rounded-xl border border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800/60
              hover:shadow-lg hover:border-brand/30
              transition-all duration-200
              no-underline
            "
          >
            {/* Icon */}
            <div
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                ${card.color}
                group-hover:scale-110 transition-transform duration-200
              `}
            >
              <FontAwesomeIcon icon={card.icon} className="text-lg" />
            </div>

            {/* Text */}
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 group-hover:text-brand-dark dark:group-hover:text-brand-light transition-colors">
                {card.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {card.description}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex items-center text-sm text-brand dark:text-brand-light font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              进入管理
              <svg
                className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M6.47 3.47a.75.75 0 011.06 0l4 4a.75.75 0 010 1.06l-4 4a.75.75 0 11-1.06-1.06L9.94 8 6.47 4.53a.75.75 0 010-1.06z" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
