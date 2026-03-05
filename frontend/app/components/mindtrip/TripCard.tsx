"use client";

import { motion } from "framer-motion";


interface TripCardProps {
  image: string;
  title: string;
  location: string;
  duration: string;
  price?: string;
  rating?: number;
  index?: number;
  onClick?: () => void;
}

export function TripCard({
  image,
  title,
  location,
  duration,
  price,
  rating,
  index = 0,
  onClick,
}: TripCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-[var(--surface)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-md)] cursor-pointer card-hover"
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
        />
        {rating && (
          <div className="absolute top-3 right-3 bg-[var(--surface)]/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
            <span className="text-[var(--color-brand)]">★</span>
            <span className="text-sm font-medium text-[var(--foreground)]">{rating}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-[var(--foreground)] font-semibold text-lg leading-tight mb-1 line-clamp-1">
          {title}
        </h3>
        <p className="text-[var(--muted)] text-sm mb-3">{location}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--color-brand)]">⏱</span>
            <span>{duration}</span>
          </div>
          {price && (
            <span className="text-[var(--color-brand-dark)] font-semibold">{price}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
