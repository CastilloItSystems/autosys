"use client";

import dynamic from "next/dynamic";

const TurnoverAnalysis = dynamic(
  () => import("@/modules/inventory/reports/components/TurnoverAnalysis"),
  { ssr: false },
);

export default function TurnoverAnalysisPage() {
  return <TurnoverAnalysis />;
}
