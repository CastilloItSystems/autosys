"use client";

import dynamic from "next/dynamic";

const ABCAnalysis = dynamic(
  () => import("@/modules/inventory/reports/components/ABCAnalysis"),
  { ssr: false },
);

export default function ABCAnalysisPage() {
  return <ABCAnalysis />;
}
