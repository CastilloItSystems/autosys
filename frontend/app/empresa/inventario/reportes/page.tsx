import InventoryDashboard from "@/components/inventory/reports/InventoryDashboard";

export const metadata = {
  title: "Dashboard de Inventario | AutoSys",
  description: "Vista general de métricas y KPIs de inventario",
};

export default function InventoryReportsDashboardPage() {
  return <InventoryDashboard />;
}
