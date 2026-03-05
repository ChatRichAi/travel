"use client";

import { useState } from "react";
import { Input, Button, Empty } from "@arco-design/web-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSearch, faTrash, faMessage, faRoute } from "@fortawesome/free-solid-svg-icons";
import CurrentItineraryCard from "./CurrentItineraryCard";

interface Conversation {
  id: number;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onDelete: (id: number) => void;
  onCreateItinerary?: () => void;
  loading?: boolean;
  generatingItinerary?: boolean;
}

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onCreateItinerary,
  loading,
  generatingItinerary,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full w-72 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* New Chat & New Itinerary Buttons */}
      <div className="space-y-2 p-3">
        <Button
          type="primary"
          long
          icon={<FontAwesomeIcon icon={faPlus} />}
          onClick={onCreate}
          className="!bg-[var(--color-brand)] !border-[var(--color-brand)] hover:!bg-[var(--color-brand-dark)]"
        >
          新建对话
        </Button>
        {onCreateItinerary && (
          <Button
            type="outline"
            long
            icon={<FontAwesomeIcon icon={faRoute} />}
            onClick={onCreateItinerary}
            className="!text-[var(--color-brand)] !border-[var(--color-brand)] hover:!bg-[var(--color-brand-bg)]"
          >
            创建新行程
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <Input
          placeholder="搜索对话..."
          prefix={<FontAwesomeIcon icon={faSearch} className="text-gray-400" />}
          value={search}
          onChange={setSearch}
          allowClear
        />
      </div>

      {/* Current Itinerary Card */}
      <CurrentItineraryCard />

      {/* Conversation List - hidden during itinerary generation */}
      {!generatingItinerary && (
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--color-brand)]" />
          </div>
        ) : filtered.length === 0 ? (
          <Empty description="暂无对话" className="mt-8" />
        ) : (
          <div className="space-y-1 px-2">
            {filtered.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                  activeId === conv.id
                    ? "bg-[var(--color-brand-bg)] text-[var(--color-brand-dark)]"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FontAwesomeIcon
                    icon={faMessage}
                    className={`shrink-0 text-xs ${
                      activeId === conv.id
                        ? "text-[var(--color-brand)]"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="truncate text-sm text-gray-800 dark:text-gray-200">
                    {conv.title || "新对话"}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="ml-1 hidden shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 group-hover:block dark:hover:bg-red-900/20"
                  title="删除对话"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
