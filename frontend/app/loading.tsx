import { ProgressSpinner } from "primereact/progressspinner";

export default function RootLoading() {
  return (
    <div className="flex align-items-center justify-content-center w-full" style={{ minHeight: "100vh" }}>
      <ProgressSpinner strokeWidth="3" />
    </div>
  );
}
