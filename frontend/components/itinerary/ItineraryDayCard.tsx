"use client";

import { useState } from "react";
import { Input, Rate, Tag } from "@arco-design/web-react";
import { IconDown, IconUp } from "@arco-design/web-react/icon";
import DaySectionEditor from "./DaySectionEditor";
import type { ItineraryDay, DayImages } from "@/types";

interface Props {
  day: ItineraryDay;
  itineraryId: number;
  onChange: (dayId: number, field: string, value: unknown) => void;
  onImageChange: (dayId: number, images: DayImages) => void;
}

export default function ItineraryDayCard({
  day,
  itineraryId,
  onChange,
  onImageChange,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const images: DayImages = day.images || { location: [], attractions: [], transport: [], accommodation: [] };

  const handleImageUploaded = (section: keyof DayImages, url: string) => {
    const updated = { ...images, [section]: [...(images[section] || []), url] };
    onImageChange(day.id, updated);
  };

  const handleImageDeleted = (section: keyof DayImages, url: string) => {
    const updated = { ...images, [section]: (images[section] || []).filter((u: string) => u !== url) };
    onImageChange(day.id, updated);
  };

  const sections = [
    { key: "location_desc" as const, label: "旅游地点", icon: "📍", section: "location" as const },
    { key: "attractions" as const, label: "景点亮点", icon: "✅", section: "attractions" as const },
    { key: "transport_info" as const, label: "用车信息", icon: "🚗", section: "transport" as const },
    { key: "accommodation" as const, label: "住宿推荐", icon: "🏨", section: "accommodation" as const },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between px-5 py-3"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          <Tag color="arcoblue" size="small">第 {day.day_number} 天</Tag>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {day.title || `第${day.day_number}天`}
          </span>
          {day.city_route && (
            <span className="text-xs text-gray-500">{day.city_route}</span>
          )}
        </div>
        {collapsed ? <IconDown /> : <IconUp />}
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="space-y-5 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          {/* Day title & route */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500">日程标题</label>
              <Input
                value={day.title || ""}
                onChange={(v) => onChange(day.id, "title", v)}
                size="small"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">城市路线</label>
              <Input
                value={day.city_route || ""}
                onChange={(v) => onChange(day.id, "city_route", v)}
                size="small"
                placeholder="例如：广州-哈尔滨"
              />
            </div>
          </div>

          {/* 4 Sections */}
          {sections.map((s) => (
            <DaySectionEditor
              key={s.key}
              label={s.label}
              icon={s.icon}
              value={(day[s.key] as string) || ""}
              onChange={(v) => onChange(day.id, s.key, v)}
              images={images[s.section] || []}
              itineraryId={itineraryId}
              dayId={day.id}
              section={s.section}
              onImageUploaded={(url) => handleImageUploaded(s.section, url)}
              onImageDeleted={(url) => handleImageDeleted(s.section, url)}
            />
          ))}

          {/* Accommodation rating */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">住宿星级</span>
            <Rate
              value={day.accommodation_rating || 5}
              onChange={(v) => onChange(day.id, "accommodation_rating", v)}
              count={5}
            />
          </div>

          {/* Daily notes */}
          <div>
            <label className="mb-1 block text-xs text-gray-500">今日注意事项</label>
            <Input.TextArea
              value={day.daily_notes || ""}
              onChange={(v) => onChange(day.id, "daily_notes", v)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              className="!text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
