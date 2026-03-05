"use client";

import { useState } from "react";
import {
  Header,
  SplitLayout,
  ChatMessage,
  ChatInput,
  TripCard,
  DaySection,
  MapPanel,
} from "../../components/mindtrip";

// 示例数据
const sampleTrips = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=500&fit=crop",
    title: "京都古寺巡礼",
    location: "日本 · 京都",
    duration: "5 天",
    price: "¥12,800",
    rating: 4.9,
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=500&fit=crop",
    title: "巴厘岛度假",
    location: "印度尼西亚 · 巴厘岛",
    duration: "7 天",
    price: "¥8,900",
    rating: 4.7,
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop",
    title: "巴黎浪漫之旅",
    location: "法国 · 巴黎",
    duration: "6 天",
    price: "¥18,500",
    rating: 4.8,
  },
];

const sampleDays = [
  {
    day: 1,
    date: "2024年4月15日",
    activities: [
      {
        time: "morning",
        title: "抵达京都",
        description: "从关西机场乘坐 Haruka 特急列车前往京都，约需75分钟。入住位于祇园的传统日式旅馆。",
        icon: "✈️",
      },
      {
        time: "afternoon",
        title: "清水寺",
        description: "参观世界文化遗产清水寺，欣赏著名的清水舞台和音羽瀑布。建议停留2-3小时。",
        icon: "⛩️",
      },
      {
        time: "evening",
        title: "祇园漫步",
        description: "在祇园的石板小巷中漫步，体验传统京都风情，或许能偶遇艺伎。",
        icon: "🌸",
      },
    ],
  },
  {
    day: 2,
    date: "2024年4月16日",
    activities: [
      {
        time: "morning",
        title: "伏见稻荷大社",
        description: "清晨前往伏见稻荷大社，穿越千本鸟居。建议7点前到达避开人潮。",
        icon: "⛩️",
      },
      {
        time: "afternoon",
        title: "岚山",
        description: "乘坐岚山小火车欣赏保津川溪谷美景，漫步竹林小径，参观天龙寺。",
        icon: "🎋",
      },
    ],
  },
];

const mapLocations = [
  { id: "1", name: "清水寺", x: 55, y: 45 },
  { id: "2", name: "祇园", x: 60, y: 50 },
  { id: "3", name: "伏见稻荷", x: 70, y: 65 },
  { id: "4", name: "岚山", x: 25, y: 35 },
  { id: "5", name: "金阁寺", x: 30, y: 25 },
];

export default function MindtripDemo() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      content: "你好！我是你的 AI 旅行规划师。请告诉我你想去哪里旅行？",
      isUser: false,
      timestamp: "刚刚",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (content: string) => {
    // 添加用户消息
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content,
        isUser: true,
        timestamp: "刚刚",
      },
    ]);

    // 模拟 AI 正在输入
    setIsTyping(true);

    // 模拟 AI 回复
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content:
            "太棒了！京都是一个绝佳的选择。我可以为你规划一个 5 天的行程，包含古寺、美食和文化体验。你想重点关注哪些方面？",
          isUser: false,
          timestamp: "刚刚",
        },
      ]);
    }, 2000);
  };

  const LeftContent = (
    <div className="flex flex-col h-full">
      {/* Chat Section */}
      <div className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            content={msg.content}
            isUser={msg.isUser}
            timestamp={msg.timestamp}
          />
        ))}
        {isTyping && (
          <ChatMessage content="" isUser={false} isTyping={true} />
        )}

        {/* Suggested Trip Cards */}
        {messages.length > 2 && (
          <div className="grid grid-cols-1 gap-4 mt-6">
            <p className="text-sm text-[var(--muted)] mb-2">为你推荐</p>
            {sampleTrips.map((trip, i) => (
              <TripCard key={trip.id} {...trip} index={i} />
            ))}
          </div>
        )}

        {/* Day Itinerary */}
        {messages.length > 3 && (
          <div className="mt-8">
            <h2 className="text-title text-[var(--foreground)] mb-6">
              推荐行程
            </h2>
            {sampleDays.map((day, i) => (
              <DaySection key={day.day} {...day} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)]">
        <ChatInput
          onSend={handleSendMessage}
          placeholder="输入你想去的地方或旅行偏好..."
          disabled={isTyping}
        />
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[var(--background)]">
      <Header userName="旅行者" />
      <div className="pt-16 h-full">
        <SplitLayout
          leftContent={LeftContent}
          rightContent={<MapPanel locations={mapLocations} />}
          leftWidth="45%"
          rightWidth="55%"
        />
      </div>
    </div>
  );
}
