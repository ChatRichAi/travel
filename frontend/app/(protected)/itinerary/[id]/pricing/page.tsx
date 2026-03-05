"use client";

import { use } from "react";
import PricingPage from "@/components/pricing/PricingPage";

export default function PricingRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PricingPage itineraryId={Number(id)} />;
}
