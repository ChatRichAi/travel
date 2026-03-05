"use client";

import { motion } from "framer-motion";

interface MapLocation {
  id: string;
  name: string;
  x: number; // percentage
  y: number; // percentage
}

interface MapPanelProps {
  locations?: MapLocation[];
  activeLocation?: string;
  onLocationClick?: (id: string) => void;
}

export function MapPanel({
  locations = [],
  activeLocation,
  onLocationClick,
}: MapPanelProps) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#e8e4dc] to-[#d8d4cc] dark:from-[#2a2620] dark:to-[#1a1712] overflow-hidden">
      {/* Decorative Map Elements */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Decorative circles representing areas */}
        <circle cx="30%" cy="40%" r="80" fill="var(--color-brand)" fillOpacity="0.1" />
        <circle cx="70%" cy="60%" r="120" fill="var(--color-brand)" fillOpacity="0.08" />
        <circle cx="50%" cy="30%" r="60" fill="var(--color-brand)" fillOpacity="0.06" />

        {/* Connection lines */}
        <path
          d="M 30% 40% Q 50% 50% 70% 60%"
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="2"
          strokeDasharray="5,5"
          strokeOpacity="0.4"
        />
      </svg>

      {/* Location Markers */}
      {locations.map((location, index) => (
        <motion.button
          key={location.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.4,
            delay: index * 0.1,
            type: "spring",
            stiffness: 200,
          }}
          onClick={() => onLocationClick?.(location.id)}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
          style={{ left: `${location.x}%`, top: `${location.y}%` }}
        >
          {/* Marker */}
          <div
            className={`relative transition-all duration-300 ${
              activeLocation === location.id ? "scale-125" : ""
            }`}
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[var(--color-brand)] animate-ping opacity-30" />

            {/* Marker dot */}
            <div className="relative w-4 h-4 bg-[var(--color-brand)] rounded-full border-2 border-white shadow-lg" />

            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[var(--surface)] px-3 py-1.5 rounded-full shadow-md text-sm font-medium text-[var(--foreground)]"
            >
              {location.name}
            </motion.div>
          </div>
        </motion.button>
      ))}

      {/* Map Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <button className="btn-icon shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
        </button>
        <button className="btn-icon shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
          </svg>
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute top-6 left-6 bg-[var(--surface)]/90 backdrop-blur-sm rounded-[var(--radius-lg)] px-4 py-3 shadow-md">
        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          行程路线
        </h4>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand)]" />
          <span>已规划地点</span>
        </div>
      </div>
    </div>
  );
}
