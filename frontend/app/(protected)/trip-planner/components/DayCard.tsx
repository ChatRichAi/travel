"use client";

import { motion } from "framer-motion";

interface Activity {
  id: string;
  time: string;
  title: string;
  type: string;
  description: string;
  image: string;
  duration?: string;
}

interface DayData {
  day: number;
  title: string;
  emoji: string;
  description: string;
  activities: Activity[];
}

interface DayCardProps {
  day: DayData;
  isActive: boolean;
  onSelect: () => void;
  onAttractionClick: (activity: Activity) => void;
  onAddToTrip: (id: string) => void;
  addedAttractions: Set<string>;
  delay?: number;
}

const typeIcons: Record<string, string> = {
  hotel: "🏨",
  attraction: "📍",
  restaurant: "🍽️",
  activity: "🎯",
};

export function DayCard({
  day,
  isActive,
  onSelect,
  onAttractionClick,
  onAddToTrip,
  addedAttractions,
  delay = 0,
}: DayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-xl border transition-all ${
        isActive ? "border-[var(--color-brand)] bg-[var(--color-brand-bg)]" : "border-gray-200 bg-white"
      }`}
    >
      {/* Day 标题 */}
      <div className="p-4 cursor-pointer" onClick={onSelect}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{day.emoji}</span>
          <h3 className="text-lg font-bold text-gray-900">
            Day {day.day} – {day.title}
          </h3>
        </div>
        <p className="text-gray-600 text-sm italic">{day.description}</p>
      </div>

      {/* 活动列表 */}
      <div className="px-4 pb-4 space-y-3">
        {day.activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + index * 0.05 }}
            className="flex gap-3 group"
          >
            {/* 时间 */}
            <div className="w-16 flex-shrink-0 text-sm text-gray-500 font-medium">
              {activity.time}
            </div>

            {/* 内容 */}
            <div className="flex-1">
              <button
                onClick={() => onAttractionClick(activity)}
                className="text-left hover:text-[var(--color-brand)] transition-colors"
              >
                <span className="font-semibold text-gray-900 group-hover:text-[var(--color-brand)]">
                  {activity.title}
                </span>
                {activity.duration && (
                  <span className="text-sm text-gray-500 ml-2">{activity.duration}</span>
                )}
              </button>
              <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
            </div>

            {/* 添加按钮 */}
            <button
              onClick={() => onAddToTrip(activity.id)}
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                addedAttractions.has(activity.id)
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-500"
              }`}
            >
              {addedAttractions.has(activity.id) ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* 图片预览 */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {day.activities.slice(0, 3).map((activity) => (
            <button
              key={activity.id}
              onClick={() => onAttractionClick(activity)}
              className="flex-shrink-0 relative group"
            >
              <img
                src={activity.image}
                alt={activity.title}
                className="w-24 h-16 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
              <div className="absolute top-1 right-1">
                <svg className="w-4 h-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
