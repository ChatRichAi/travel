"use client";

import { Tag, Switch, Message } from "@arco-design/web-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Itinerary, OrderStatus } from "@/types";

const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  draft: { label: "草稿", color: "gray" },
  confirmed: { label: "已确认", color: "blue" },
  in_progress: { label: "进行中", color: "gold" },
  completed: { label: "已完成", color: "green" },
  cancelled: { label: "已取消", color: "red" },
};

interface Props {
  plan: Itinerary;
  onTagChange: () => void;
}

export default function PlanCard({ plan, onTagChange }: Props) {
  const router = useRouter();
  const statusInfo = STATUS_MAP[plan.status] || { label: plan.status, color: "gray" };

  const toggleTag = async (tag: "is_shared" | "is_featured" | "is_closed", value: boolean) => {
    try {
      await api.put(`/itinerary/${plan.id}/tags`, { [tag]: value });
      onTagChange();
    } catch {
      Message.error("更新失败");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      <div
        className="cursor-pointer"
        onClick={() => router.push(`/itinerary/${plan.id}`)}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {plan.title}
          </h3>
          <Tag color={statusInfo.color} size="small">{statusInfo.label}</Tag>
        </div>

        {plan.destination && (
          <p className="mb-1 text-xs text-gray-500">{plan.destination}</p>
        )}

        {plan.highlights && (
          <p className="mb-2 text-xs text-gray-400 line-clamp-2">{plan.highlights}</p>
        )}

        <div className="flex gap-3 text-xs text-gray-400">
          {plan.start_date && <span>{plan.start_date.slice(0, 10)}</span>}
          {plan.start_date && plan.end_date && <span>~</span>}
          {plan.end_date && <span>{plan.end_date.slice(0, 10)}</span>}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3 dark:border-gray-800">
        <label className="flex items-center gap-1 text-xs text-gray-500">
          <Switch
            size="small"
            checked={plan.is_shared}
            onChange={(v) => toggleTag("is_shared", v)}
          />
          共享
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-500">
          <Switch
            size="small"
            checked={plan.is_featured}
            onChange={(v) => toggleTag("is_featured", v)}
          />
          精华
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-500">
          <Switch
            size="small"
            checked={plan.is_closed}
            onChange={(v) => toggleTag("is_closed", v)}
          />
          成交
        </label>
      </div>
    </div>
  );
}
