"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// 模拟生成步骤
const generationSteps = [
  { icon: "🌍", text: "Researching destination..." },
  { icon: "🏨", text: "Finding best accommodations..." },
  { icon: "🎯", text: "Selecting top attractions..." },
  { icon: "🍽️", text: "Curating dining experiences..." },
  { icon: "🗺️", text: "Optimizing daily routes..." },
  { icon: "✨", text: "Finalizing your itinerary..." },
];

export default function CreateTripPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    destination: "",
    days: 4,
    travelers: 1,
    style: "adventurous",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showForm, setShowForm] = useState(true);

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.destination.trim()) return;
    
    setShowForm(false);
    setIsGenerating(true);
  };

  // 模拟生成过程
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= generationSteps.length - 1) {
          clearInterval(interval);
          // 生成完成，跳转到 trip-planner
          setTimeout(() => {
            router.push(`/trip-planner?destination=${encodeURIComponent(formData.destination)}&days=${formData.days}`);
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isGenerating, formData, router]);

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* 顶部导航 */}
      <div className="h-14 border-b border-gray-200 flex items-center px-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* 主内容 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="w-full max-w-xl"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Plan your dream trip
              </h1>
              <p className="text-gray-500 mb-8">
                Tell us where you want to go and we'll create a personalized itinerary
              </p>

              {/* 目的地输入 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Where do you want to go?
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g., Singapore, Tokyo, Paris..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent outline-none text-lg"
                  autoFocus
                />
              </div>

              {/* 天数选择 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many days?
                </label>
                <div className="flex gap-3">
                  {[3, 4, 5, 7, 10].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setFormData({ ...formData, days: day })}
                      className={`flex-1 py-3 rounded-xl border transition-all ${
                        formData.days === day
                          ? "border-[var(--color-brand)] bg-[var(--color-brand-bg)] text-[var(--color-brand-dark)]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {day} days
                    </button>
                  ))}
                </div>
              </div>

              {/* 人数选择 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many travelers?
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, travelers: Math.max(1, formData.travelers - 1) })}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="text-xl font-medium w-8 text-center">{formData.travelers}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, travelers: formData.travelers + 1 })}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 风格选择 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "relaxed", label: "Relaxed", emoji: "🧘" },
                    { id: "balanced", label: "Balanced", emoji: "⚖️" },
                    { id: "adventurous", label: "Adventurous", emoji: "🎒" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, style: style.id })}
                      className={`py-3 px-4 rounded-xl border transition-all ${
                        formData.style === style.id
                          ? "border-[var(--color-brand)] bg-[var(--color-brand-bg)]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl mb-1 block">{style.emoji}</span>
                      <span className="text-sm font-medium">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={!formData.destination.trim()}
                className="w-full py-4 bg-[var(--color-brand)] text-white rounded-xl font-medium text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                Create My Trip
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              {/* AI 头像 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </motion.div>

              {/* 标题 */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Just a sec ⏳
              </h2>
              <p className="text-gray-500 mb-8">
                AI is crafting your perfect {formData.days}-day trip to {formData.destination}
              </p>

              {/* 生成步骤 */}
              <div className="space-y-4 max-w-md mx-auto">
                {generationSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: index <= currentStep ? 1 : 0.3,
                      x: 0 
                    }}
                    className="flex items-center gap-3"
                  >
                    <motion.div
                      animate={{
                        scale: index === currentStep ? [1, 1.2, 1] : 1,
                      }}
                      transition={{ repeat: index === currentStep ? Infinity : 0, duration: 1 }}
                      className="text-2xl"
                    >
                      {step.icon}
                    </motion.div>
                    <span className={`text-lg ${index === currentStep ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                      {step.text}
                    </span>
                    {index < currentStep && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto text-green-500"
                      >
                        ✓
                      </motion.span>
                    )}
                    {index === currentStep && (
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="ml-auto text-[var(--color-brand)]"
                      >
                        ●
                      </motion.span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
