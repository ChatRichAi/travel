"use client";

import { motion } from "framer-motion";

interface Trip {
  title: string;
  destination: string;
  days: number;
  itinerary: Array<{
    day: number;
    title: string;
    emoji: string;
    activities: Array<{
      id: string;
      title: string;
      time: string;
      image: string;
    }>;
  }>;
}

interface RightPanelProps {
  trip: Trip;
  onClose: () => void;
}

export function RightPanel({ trip, onClose }: RightPanelProps) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-50 flex flex-col"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="font-bold text-lg truncate max-w-[250px]">{trip.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-[var(--color-brand)] text-white text-sm rounded-full hover:opacity-90">
            Go to trip
          </button>
          <button className="px-3 py-1.5 border border-gray-300 text-sm rounded-full hover:bg-gray-50">
            Invite
          </button>
        </div>
      </div>

      {/* 标签栏 */}
      <div className="flex border-b border-gray-200">
        {["Itinerary", "Calendar", "Bookings", "Chats", "Media"].map((tab, i) => (
          <button
            key={tab}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              i === 0
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {/* Ideas 区域 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Ideas</span>
            <span className="text-sm text-gray-400">0 items</span>
          </div>
          <button className="w-full h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm">Add</span>
          </button>
        </div>

        {/* 行程列表 */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Itinerary</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{trip.days} days</span>
              <button className="text-sm text-gray-500 hover:text-gray-700">Distances</button>
            </div>
          </div>

          {trip.itinerary.map((day) => (
            <div key={day.day} className="mb-6">
              {/* Day 标题 */}
              <button className="flex items-center gap-2 w-full py-2 hover:bg-gray-50 rounded-lg">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="font-semibold text-gray-900">
                  Day {day.day} {day.emoji} {day.title}
                </span>
              </button>

              {/* 活动列表 */}
              <div className="ml-6 mt-2 space-y-3">
                {day.activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <img
                      src={activity.image}
                      alt={activity.title}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <button className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50">
                      Book
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
