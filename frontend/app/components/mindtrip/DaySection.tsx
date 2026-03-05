"use client";

import { motion } from "framer-motion";

interface Activity {
  time: string;
  title: string;
  description: string;
  icon: string;
}

interface DaySectionProps {
  day: number;
  date: string;
  activities: Activity[];
  index?: number;
}

const timeIcons: Record<string, string> = {
  morning: "☀️",
  afternoon: "🌤️",
  evening: "🌙",
};

export function DaySection({ day, date, activities, index = 0 }: DaySectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="day-timeline mb-8"
    >
      {/* Day Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="day-marker text-[var(--color-brand)] font-semibold">
          {day}
        </div>
        <div>
          <h3 className="text-[var(--foreground)] font-semibold text-lg">
            第 {day} 天
          </h3>
          <p className="text-[var(--muted)] text-sm">{date}</p>
        </div>
      </div>

      {/* Activities */}
      <div className="space-y-4 pl-1">
        {activities.map((activity, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.15 + i * 0.1,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="bg-[var(--surface)] rounded-[var(--radius-md)] p-4 border border-[var(--border)] hover:border-[var(--color-brand-light)] transition-colors duration-300"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl" role="img" aria-label={activity.time}>
                {timeIcons[activity.time] || activity.icon}
              </span>
              <div className="flex-1">
                <h4 className="text-[var(--foreground)] font-medium mb-1">
                  {activity.title}
                </h4>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {activity.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
