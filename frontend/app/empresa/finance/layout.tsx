import type { ReactNode } from "react";
import ClientOnlySegment from "@/shared/components/ClientOnlySegment";

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <ClientOnlySegment
      skeletonProps={{ rows: 8, columns: 7, titleWidth: "16rem" }}
    >
      {children}
    </ClientOnlySegment>
  );
}
