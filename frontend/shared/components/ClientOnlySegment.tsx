"use client";

import type { ReactNode } from "react";
import {
  ClientOnly,
  DataTableSkeleton,
  type DataTableSkeletonProps,
} from "./ClientOnlyDataTable";

interface ClientOnlySegmentProps {
  children: ReactNode;
  skeletonProps?: DataTableSkeletonProps;
}

const ClientOnlySegment = ({
  children,
  skeletonProps,
}: ClientOnlySegmentProps) => {
  return (
    <ClientOnly fallback={<DataTableSkeleton {...skeletonProps} />}>
      {children}
    </ClientOnly>
  );
};

export default ClientOnlySegment;
