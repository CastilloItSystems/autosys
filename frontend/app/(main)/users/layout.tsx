import type { ReactNode } from "react";
import ClientOnlySegment from "@/shared/components/ClientOnlySegment";

export default function UsersLayout({ children }: { children: ReactNode }) {
  return (
    <ClientOnlySegment
      skeletonProps={{ rows: 8, columns: 6, titleWidth: "9rem" }}
    >
      {children}
    </ClientOnlySegment>
  );
}
