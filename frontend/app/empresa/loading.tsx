import { ProgressSpinner } from "primereact/progressspinner";

export default function EmpresaLoading() {
  return (
    <div className="flex align-items-center justify-content-center w-full" style={{ minHeight: "60vh" }}>
      <ProgressSpinner strokeWidth="3" />
    </div>
  );
}
