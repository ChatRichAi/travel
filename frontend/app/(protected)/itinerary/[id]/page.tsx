"use client";

import { use } from "react";
import ItineraryDetail from "@/components/itinerary/ItineraryDetail";

export default function ItineraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ItineraryDetail itineraryId={Number(id)} />;
}
