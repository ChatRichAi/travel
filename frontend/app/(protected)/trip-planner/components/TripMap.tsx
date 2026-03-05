"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Location {
  lat: number;
  lng: number;
}

interface Activity {
  id: string;
  title: string;
  type: string;
  location: Location;
  image: string;
  day: number;
}

interface TripMapProps {
  center: Location;
  activities: Activity[];
  selectedActivity: Activity | null;
  onMarkerClick: (activity: Activity) => void;
}

export function TripMap({ center, activities, selectedActivity, onMarkerClick }: TripMapProps) {
  const [zoom, setZoom] = useState(13);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });

  // 模拟地图移动
  useEffect(() => {
    // 当中心点改变时，模拟平滑移动
    setMapOffset({ x: 0, y: 0 });
  }, [center]);

  return (
    <div className="w-full h-full relative bg-[#e5e7eb] overflow-hidden">
      {/* 模拟地图背景 - 使用 Google Maps 风格 */}
      <div
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{
          backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${center.lng},${center.lat},${zoom},0/800x800?access_token=pk.eyJ1IjoiZGVtbyIsImEiOiJja2V0b3JtZzAwMHBpMnJ0Y2R4a3Z5Ynp1In0.8G3lJ1g4V')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* 模拟地图网格 */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* 标记点 */}
      <AnimatePresence>
        {activities.map((activity, index) => {
          const isSelected = selectedActivity?.id === activity.id;
          // 将经纬度转换为相对于中心点的像素位置（简化计算）
          const offsetX = (activity.location.lng - center.lng) * 10000 * zoom;
          const offsetY = (activity.location.lat - center.lat) * -10000 * zoom;

          return (
            <motion.button
              key={activity.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isSelected ? 1.2 : 1,
                opacity: 1,
                x: offsetX,
                y: offsetY,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: index * 0.05, type: "spring" }}
              onClick={() => onMarkerClick(activity)}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ marginLeft: offsetX, marginTop: offsetY }}
            >
              <div className="relative">
                {/* 脉冲效果 */}
                {isSelected && (
                  <span className="absolute inset-0 animate-ping bg-[var(--color-brand)] rounded-full opacity-30" />
                )}
                {/* 标记 */}
                <div
                  className={`relative w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center overflow-hidden ${
                    isSelected ? "ring-2 ring-[var(--color-brand)]" : ""
                  }`}
                >
                  <img
                    src={activity.image}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 标签 */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: isSelected ? 1 : 0, y: isSelected ? 0 : 5 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-white px-2 py-1 rounded shadow-md text-xs font-medium"
                >
                  {activity.title}
                </motion.div>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* 中心标记 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-4 h-4 bg-[var(--color-brand)] rounded-full opacity-50" />
      </div>

      {/* 地图控件 */}
      <div className="absolute top-4 left-4 flex gap-2">
        <button className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* 更多选项 */}
      <div className="absolute top-4 right-4">
        <button className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
