import ReturnList from "@/components/inventory/returns/ReturnList";

export const metadata = {
  title: "Gestión de Devoluciones",
};

export default function ReturnsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Devoluciones</h1>
        <p className="text-gray-600">
          Gestión de devoluciones de proveedores, talleres y clientes
        </p>
      </div>
      <ReturnList />
    </div>
  );
}
