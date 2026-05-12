"use client";

import dynamic from "next/dynamic";

const FinanceDashboard = dynamic(
  () => import("@/modules/finance/dashboard/components/FinanceDashboard"),
  { ssr: false },
);

export default function FinanzasDashboardPage() {
  return <FinanceDashboard />;
}
