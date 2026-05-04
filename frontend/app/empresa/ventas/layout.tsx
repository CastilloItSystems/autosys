import type { ReactNode } from "react";
import ClientOnlySegment from "@/shared/components/ClientOnlySegment";

export default function VentasLayout({ children }: { children: ReactNode }) {
  return (
    <ClientOnlySegment
      skeletonProps={{ rows: 8, columns: 7, titleWidth: "14rem" }}
    >
      {children}
    </ClientOnlySegment>
  );
}
