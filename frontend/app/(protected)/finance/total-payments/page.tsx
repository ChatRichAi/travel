"use client";

import { useMemo } from "react";
import { Tag } from "@arco-design/web-react";
import { IconArrowRise, IconArrowFall } from "@arco-design/web-react/icon";
import useSWR from "swr";
import { swrFetcher } from "@/lib/api";

interface FinanceSummary {
  total_received: number;
  total_paid: number;
  pending_amount: number;
  transaction_count: number;
  monthly_data?: { month: string; received: number; paid: number }[];
}

function formatCurrency(val: number) {
  return `¥${val?.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}`;
}

export default function TotalPaymentsPage() {
  const { data, isLoading } = useSWR<FinanceSummary>("/finance/summary", swrFetcher);

  const balance = useMemo(() => {
    if (!data) return 0;
    return data.total_received - data.total_paid;
  }, [data]);

  const barData = useMemo(() => {
    if (!data?.monthly_data || data.monthly_data.length === 0) {
      // Generate sample months if no data
      return [
        { month: "1月", received: 0, paid: 0 },
        { month: "2月", received: 0, paid: 0 },
        { month: "3月", received: 0, paid: 0 },
        { month: "4月", received: 0, paid: 0 },
        { month: "5月", received: 0, paid: 0 },
        { month: "6月", received: 0, paid: 0 },
      ];
    }
    return data.monthly_data;
  }, [data]);

  const maxVal = useMemo(() => {
    const max = Math.max(...barData.map((d) => Math.max(d.received, d.paid)), 1);
    return max;
  }, [barData]);

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">财务总览</h1>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">财务总览</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          收支汇总及趋势分析
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Received */}
        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">总收款</span>
            <Tag color="green" size="small">
              <IconArrowRise /> 收入
            </Tag>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(data?.total_received ?? 0)}
          </p>
        </div>

        {/* Total Paid */}
        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">总付款</span>
            <Tag color="red" size="small">
              <IconArrowFall /> 支出
            </Tag>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(data?.total_paid ?? 0)}
          </p>
        </div>

        {/* Pending */}
        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">待处理</span>
            <Tag color="orangered" size="small">
              待审
            </Tag>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(data?.pending_amount ?? 0)}
          </p>
        </div>

        {/* Transaction Count */}
        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">交易笔数</span>
            <Tag color="arcoblue" size="small">
              合计
            </Tag>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data?.transaction_count ?? 0}
          </p>
        </div>
      </div>

      {/* Net Balance */}
      <div className="p-5 bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 rounded-xl border border-brand-200 dark:border-brand-800/40">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
              净余额（收款 - 付款）
            </span>
            <p
              className={`text-3xl font-bold mt-1 ${
                balance >= 0
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {formatCurrency(balance)}
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              balance >= 0
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-red-100 dark:bg-red-900/30"
            }`}
          >
            {balance >= 0 ? (
              <IconArrowRise className="text-green-600 dark:text-green-400 text-xl" />
            ) : (
              <IconArrowFall className="text-red-600 dark:text-red-400 text-xl" />
            )}
          </div>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">月度收支趋势</h3>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">收款</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">付款</span>
          </div>
        </div>

        {/* Bars */}
        <div className="flex items-end gap-4 h-52">
          {barData.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end gap-1 w-full h-44">
                {/* Received bar */}
                <div className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                    {item.received > 0 ? `${(item.received / 10000).toFixed(0)}万` : ""}
                  </span>
                  <div
                    className="w-full bg-green-500 dark:bg-green-600 rounded-t transition-all duration-500"
                    style={{
                      height: `${maxVal > 0 ? (item.received / maxVal) * 100 : 0}%`,
                      minHeight: item.received > 0 ? "4px" : "0px",
                    }}
                  />
                </div>
                {/* Paid bar */}
                <div className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                    {item.paid > 0 ? `${(item.paid / 10000).toFixed(0)}万` : ""}
                  </span>
                  <div
                    className="w-full bg-red-400 dark:bg-red-500 rounded-t transition-all duration-500"
                    style={{
                      height: `${maxVal > 0 ? (item.paid / maxVal) * 100 : 0}%`,
                      minHeight: item.paid > 0 ? "4px" : "0px",
                    }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
