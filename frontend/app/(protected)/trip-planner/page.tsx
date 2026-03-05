"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TripMap } from "./components/TripMap";
import { DayCard } from "./components/DayCard";
import { AttractionPopup } from "./components/AttractionPopup";
import { TripHeader } from "./components/TripHeader";
import { ChatInput } from "./components/ChatInput";
import { RightPanel } from "./components/RightPanel";

// 模拟行程数据
const tripData = {
  title: "Adventurous 4 Days in Singapore",
  destination: "Singapore",
  days: 4,
  travelers: 1,
  budget: "Budget",
  itinerary: [
    {
      day: 1,
      title: "Marina Bay's Modern Marvels",
      emoji: "🌆",
      description: "Dive headfirst into the heart of Singapore's most iconic sights and futuristic gardens.",
      activities: [
        {
          id: "1",
          time: "11:00 AM",
          title: "Marina Bay Sands Singapore",
          type: "hotel",
          description: "Check in and enjoy world-class infinity pool with incredible city views.",
          location: { lat: 1.2834, lng: 103.8607 },
          image: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800",
          duration: "3 nights",
        },
        {
          id: "2",
          time: "1:00 PM",
          title: "Gardens by the Bay",
          type: "attraction",
          description: "Explore the futuristic gardens and iconic Supertree Grove.",
          location: { lat: 1.2816, lng: 103.8636 },
          image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800",
        },
        {
          id: "3",
          time: "2:35 PM",
          title: "Flower Dome",
          type: "attraction",
          description: "Marvel at the dazzling display of flowers from around the world.",
          location: { lat: 1.2831, lng: 103.8655 },
          image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800",
        },
        {
          id: "4",
          time: "3:40 PM",
          title: "Cloud Forest",
          type: "attraction",
          description: "Experience the misty magic and indoor waterfall.",
          location: { lat: 1.2835, lng: 103.8660 },
          image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800",
        },
        {
          id: "5",
          time: "7:00 PM",
          title: "Singapore River Cruise",
          type: "activity",
          description: "Float past the city's legendary skyline and waterfront.",
          location: { lat: 1.2880, lng: 103.8468 },
          image: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800",
        },
      ],
    },
    {
      day: 2,
      title: "Botanic Gardens & Sweet Escapes",
      emoji: "🌳",
      description: "Lush nature, tranquil walks, and a playful finish.",
      activities: [
        {
          id: "6",
          time: "9:00 AM",
          title: "Singapore Botanic Gardens",
          type: "attraction",
          description: "UNESCO-listed tropical garden with vibrant blooms.",
          location: { lat: 1.3138, lng: 103.8159 },
          image: "https://images.unsplash.com/photo-1590725627524-3d56c44c393a?w=800",
        },
        {
          id: "7",
          time: "12:00 PM",
          title: "National Orchid Garden",
          type: "attraction",
          description: "Stunning showcase of orchids with over 1,000 species.",
          location: { lat: 1.3116, lng: 103.8145 },
          image: "https://images.unsplash.com/photo-1566959228363-8194824b7c90?w=800",
        },
        {
          id: "8",
          time: "5:15 PM",
          title: "Museum Of Ice Cream Singapore",
          type: "attraction",
          description: "Interactive exhibits and unlimited ice cream treats.",
          location: { lat: 1.3039, lng: 103.8323 },
          image: "https://images.unsplash.com/photo-1560008581-09826d1de69e?w=800",
        },
      ],
    },
    {
      day: 3,
      title: "Chinatown's Heritage & Flavors",
      emoji: "🏮",
      description: "Historic streets, temples, and a feast for the senses.",
      activities: [
        {
          id: "9",
          time: "9:00 AM",
          title: "Chinatown",
          type: "attraction",
          description: "Explore lively markets and vibrant streets.",
          location: { lat: 1.2839, lng: 103.8436 },
          image: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800",
        },
        {
          id: "10",
          time: "12:00 PM",
          title: "Sri Mariamman Temple",
          type: "attraction",
          description: "Singapore's oldest Hindu temple with intricate architecture.",
          location: { lat: 1.2829, lng: 103.8454 },
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        },
        {
          id: "11",
          time: "6:30 PM",
          title: "Cafe Monochrome (Chinatown)",
          type: "restaurant",
          description: "2D-themed cafe with inventive menu and memorable atmosphere.",
          location: { lat: 1.2805, lng: 103.8440 },
          image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
        },
      ],
    },
    {
      day: 4,
      title: "Kampong Gelam Vibes & Sultan Mosque",
      emoji: "🕌",
      description: "Striking architecture, vibrant street life, and cultural discovery.",
      activities: [
        {
          id: "12",
          time: "12:30 PM",
          title: "Sultan Mosque",
          type: "attraction",
          description: "Majestic mosque with stunning golden domes.",
          location: { lat: 1.3021, lng: 103.8590 },
          image: "https://images.unsplash.com/photo-1570463665434-0829481f1449?w=800",
        },
        {
          id: "13",
          time: "2:00 PM",
          title: "Kampong Gelam",
          type: "attraction",
          description: "Artsy historic streets with colorful shops and eateries.",
          location: { lat: 1.3008, lng: 103.8580 },
          image: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800",
        },
      ],
    },
  ],
};

export default function TripPlannerPage() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedAttraction, setSelectedAttraction] = useState<typeof tripData.itinerary[0]["activities"][0] | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 1.2834, lng: 103.8607 });
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [addedAttractions, setAddedAttractions] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // 当选择某天时，滚动到对应位置并更新地图中心
  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    const dayData = tripData.itinerary.find((d) => d.day === day);
    if (dayData && dayData.activities.length > 0) {
      setMapCenter(dayData.activities[0].location);
    }
  };

  // 添加到行程
  const handleAddToTrip = (id: string) => {
    setAddedAttractions((prev) => new Set([...prev, id]));
    // 显示提示
    setTimeout(() => {
      setAddedAttractions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 2000);
  };

  // 获取所有活动用于地图显示
  const allActivities = tripData.itinerary.flatMap((day) =>
    day.activities.map((a) => ({ ...a, day: day.day }))
  );

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶部标题栏 */}
      <TripHeader
        title={tripData.title}
        destination={tripData.destination}
        days={tripData.days}
        travelers={tripData.travelers}
        budget={tripData.budget}
        onOpenPanel={() => setShowRightPanel(true)}
      />

      {/* 主内容区 - 左右分屏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧 - 行程内容 */}
        <div className="w-1/2 flex flex-col border-r border-gray-200">
          {/* 对话内容滚动区 */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
          >
            {/* AI 介绍 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-gray-800 leading-relaxed">
                  Here's your highly adventurous 4-day Singapore itinerary, designed for thrill-seekers
                  and culture lovers who want to experience Singapore's wonders in an energetic, immersive
                  way. Everything here is bold, dynamic, and full of discovery.
                </p>
              </div>
            </motion.div>

            {/* Day 卡片 */}
            {tripData.itinerary.map((day, index) => (
              <DayCard
                key={day.day}
                day={day}
                isActive={selectedDay === day.day}
                onSelect={() => handleDaySelect(day.day)}
                onAttractionClick={(attraction) => {
                  setSelectedAttraction(attraction);
                  setMapCenter(attraction.location);
                }}
                onAddToTrip={handleAddToTrip}
                addedAttractions={addedAttractions}
                delay={index * 0.1}
              />
            ))}

            {/* 建议问题 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-4"
            >
              <p className="text-sm text-gray-500 mb-3">You might want to ask</p>
              <div className="flex flex-wrap gap-2">
                {["What to do on day 4?", "Where to eat locally?", "How to get around efficiently?", "Any cultural tips to know?"].map((q) => (
                  <button
                    key={q}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* 底部占位 */}
            <div className="h-20" />
          </div>

          {/* 底部输入框 */}
          <ChatInput />
        </div>

        {/* 右侧 - 地图 */}
        <div className="w-1/2 relative">
          <TripMap
            center={mapCenter}
            activities={allActivities}
            selectedActivity={selectedAttraction}
            onMarkerClick={(activity) => {
              setSelectedAttraction(activity);
              setSelectedDay(activity.day);
            }}
          />

          {/* 地图控制按钮 */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50">
              <span className="text-xl">+</span>
            </button>
            <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50">
              <span className="text-xl">−</span>
            </button>
          </div>
        </div>
      </div>

      {/* 右侧详情面板 */}
      <AnimatePresence>
        {showRightPanel && (
          <RightPanel
            trip={tripData}
            onClose={() => setShowRightPanel(false)}
          />
        )}
      </AnimatePresence>

      {/* 景点详情弹窗 */}
      <AnimatePresence>
        {selectedAttraction && (
          <AttractionPopup
            attraction={selectedAttraction}
            onClose={() => setSelectedAttraction(null)}
            onAddToTrip={() => handleAddToTrip(selectedAttraction.id)}
            isAdded={addedAttractions.has(selectedAttraction.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
