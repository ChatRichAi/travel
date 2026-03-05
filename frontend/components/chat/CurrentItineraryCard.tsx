"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRoute, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

interface LatestItinerary {
  id: number;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  departure_city: string | null;
  return_city: string | null;
  adults: number | null;
  children: number | null;
  pace: string | null;
  highlights: string | null;
  notes: string | null;
}

const PACE_LABELS: Record<string, string> = {
  relaxed: "休闲",
  standard: "标准",
  intensive: "紧凑",
};

export default function CurrentItineraryCard() {
  const router = useRouter();
  const { data: itinerary } = useSWR<LatestItinerary>(
    "/itinerary/latest",
    swrFetcher
  );

  if (!itinerary) return null;

  const peopleDesc = [
    itinerary.adults ? `成人${itinerary.adults}人` : null,
    itinerary.children ? `儿童${itinerary.children}人` : null,
  ]
    .filter(Boolean)
    .join("、");

  return (
    <div className="mx-3 mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <FontAwesomeIcon
          icon={faRoute}
          className="text-[var(--color-brand)]"
        />
        当前行程
      </h4>

      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
        {itinerary.title && (
          <div>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              行程名称：
            </span>
            {itinerary.title}
          </div>
        )}
        {itinerary.start_date && (
          <div>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              出行日期：
            </span>
            {itinerary.start_date}
            {itinerary.end_date && itinerary.end_date !== itinerary.start_date
              ? ` - ${itinerary.end_date}`
              : ""}
          </div>
        )}
        {(itinerary.departure_city || itinerary.return_city) && (
          <div>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              出回城市：
            </span>
            {itinerary.departure_city || ""}
            {itinerary.return_city
              ? ` - ${itinerary.return_city}`
              : ""}
          </div>
        )}
        {itinerary.destination && (
          <div>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              要去哪里：
            </span>
            {itinerary.destination}
          </div>
        )}
        {itinerary.pace && (
          <div>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              日程安排：
            </span>
            {PACE_LABELS[itinerary.pace] || itinerary.pace}
          </div>
        )}
        {peopleDesc && (
          <div>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              出行人数：
            </span>
            {peopleDesc}
          </div>
        )}
        {itinerary.highlights && (
          <div>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              亮点：
            </span>
            <span className="line-clamp-2">{itinerary.highlights}</span>
          </div>
        )}
      </div>

      <button
        onClick={() => router.push(`/itinerary/${itinerary.id}`)}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-brand-dark)]"
      >
        查看详情
        <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
      </button>
    </div>
  );
}
