"use client";

import dynamic from "next/dynamic";

const ForecastingView = dynamic(
  () => import("@/modules/inventory/reports/components/ForecastingView"),
  { ssr: false },
);

export default function ForecastingPage() {
  return <ForecastingView />;
}
