"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Message, Spin, Empty } from "@arco-design/web-react";
import api, { swrFetcher } from "@/lib/api";
import ItineraryToolbar from "./ItineraryToolbar";
import ItineraryBasicInfo from "./ItineraryBasicInfo";
import ItineraryDayCard from "./ItineraryDayCard";
import type { Itinerary, DayImages } from "@/types";

interface Props {
  itineraryId: number;
}

export default function ItineraryDetail({ itineraryId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const { data: itinerary, isLoading, mutate } = useSWR<Itinerary>(
    `/itinerary/${itineraryId}`,
    swrFetcher
  );

  // Local editable state tracks changes before save
  const [localChanges, setLocalChanges] = useState<Record<string, unknown>>({});
  const [dayChanges, setDayChanges] = useState<Record<number, Record<string, unknown>>>({});

  const handleBasicChange = useCallback((field: string, value: unknown) => {
    setLocalChanges((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDayChange = useCallback((dayId: number, field: string, value: unknown) => {
    setDayChanges((prev) => ({
      ...prev,
      [dayId]: { ...(prev[dayId] || {}), [field]: value },
    }));
  }, []);

  const handleDayImageChange = useCallback((dayId: number, images: DayImages) => {
    setDayChanges((prev) => ({
      ...prev,
      [dayId]: { ...(prev[dayId] || {}), images },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Save itinerary-level changes
      if (Object.keys(localChanges).length > 0) {
        await api.put(`/itinerary/${itineraryId}`, localChanges);
      }

      // Save day-level changes
      const dayPromises = Object.entries(dayChanges).map(([dayId, changes]) =>
        api.put(`/itinerary/${itineraryId}/days/${dayId}`, changes)
      );
      await Promise.all(dayPromises);

      setLocalChanges({});
      setDayChanges({});
      await mutate();
      Message.success("保存成功");
    } catch {
      Message.error("保存失败");
    } finally {
      setSaving(false);
    }
  }, [itineraryId, localChanges, dayChanges, mutate]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin size={32} />
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty description="行程不存在" />
      </div>
    );
  }

  // Merge local changes into display data
  const displayItinerary: Itinerary = { ...itinerary, ...localChanges } as Itinerary;
  const displayDays = (itinerary.days || []).map((day) => ({
    ...day,
    ...(dayChanges[day.id] || {}),
  }));

  return (
    <div className="flex h-full flex-col">
      <ItineraryToolbar
        title={displayItinerary.title}
        saving={saving}
        onBack={() => router.push("/itinerary")}
        onSave={handleSave}
        onPricing={() => router.push(`/itinerary/${itineraryId}/pricing`)}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <ItineraryBasicInfo
            itinerary={displayItinerary}
            onChange={handleBasicChange}
          />

          {displayDays
            .sort((a, b) => a.day_number - b.day_number)
            .map((day) => (
              <ItineraryDayCard
                key={day.id}
                day={day}
                itineraryId={itineraryId}
                onChange={handleDayChange}
                onImageChange={handleDayImageChange}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
