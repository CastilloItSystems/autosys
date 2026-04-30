import TurnoverAnalysis from "@/modules/inventory/reports/components/TurnoverAnalysis";

export const metadata = {
  title: "Análisis de Rotación | AutoSys",
  description: "Métricas de rotación y movimiento de inventario",
};

export default function TurnoverAnalysisPage() {
  return <TurnoverAnalysis />;
}
