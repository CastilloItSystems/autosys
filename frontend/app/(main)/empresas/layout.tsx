import type { ReactNode } from "react";
import ClientOnlySegment from "@/shared/components/ClientOnlySegment";

export default function EmpresasLayout({ children }: { children: ReactNode }) {
  return (
    <ClientOnlySegment
      skeletonProps={{ rows: 8, columns: 6, titleWidth: "14rem" }}
    >
      {children}
    </ClientOnlySegment>
  );
}
