import LoanList from "@/components/inventory/loans/LoanList";

export const metadata = {
  title: "Gestión de Préstamos",
};

export default function LoansPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Préstamos</h1>
        <p className="text-gray-600">
          Gestión de préstamos de equipos y materiales
        </p>
      </div>
      <LoanList />
    </div>
  );
}
