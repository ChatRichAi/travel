"use client";

import { motion } from "framer-motion";

interface Attraction {
  id: string;
  title: string;
  type: string;
  description: string;
  image: string;
  time?: string;
}

interface AttractionPopupProps {
  attraction: Attraction;
  onClose: () => void;
  onAddToTrip: () => void;
  isAdded: boolean;
}

export function AttractionPopup({
  attraction,
  onClose,
  onAddToTrip,
  isAdded,
}: AttractionPopupProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full mx-4"
      >
        {/* 图片 */}
        <div className="relative h-48">
          <img
            src={attraction.image}
            alt={attraction.title}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button className="absolute top-3 left-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">{attraction.type}</span>
              <h3 className="text-xl font-bold text-gray-900">{attraction.title}</h3>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="font-semibold">4.5</span>
              <span className="text-gray-400 text-sm">(16k)</span>
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {attraction.description}
          </p>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Singapore</span>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={onAddToTrip}
              className={`flex-1 py-2.5 rounded-full font-medium transition-all ${
                isAdded
                  ? "bg-green-500 text-white"
                  : "bg-[var(--color-brand)] text-white hover:opacity-90"
              }`}
            >
              {isAdded ? "Added to Trip" : "Add to Trip"}
            </button>
            <button className="px-4 py-2.5 border border-gray-300 rounded-full font-medium hover:bg-gray-50">
              View Details
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
