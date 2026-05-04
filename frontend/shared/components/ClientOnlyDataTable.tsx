"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "primereact/skeleton";

export interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
  titleWidth?: string;
  showHeader?: boolean;
  className?: string;
}

export const DataTableSkeleton = ({
  rows = 8,
  columns = 6,
  titleWidth = "14rem",
  showHeader = true,
  className = "card",
}: DataTableSkeletonProps) => {
  const rowIndexes = useMemo(
    () => Array.from({ length: rows }, (_, index) => index),
    [rows],
  );
  const columnIndexes = useMemo(
    () => Array.from({ length: columns }, (_, index) => index),
    [columns],
  );

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-4">
          <Skeleton width={titleWidth} height="1.75rem" />
          <div className="flex gap-2">
            <Skeleton width="10rem" height="2.5rem" />
            <Skeleton width="8rem" height="2.5rem" />
          </div>
        </div>
      )}

      <div className="flex flex-column gap-3">
        {rowIndexes.map((rowIndex) => (
          <div
            key={rowIndex}
            className="grid align-items-center border-bottom-1 surface-border pb-3"
          >
            {columnIndexes.map((columnIndex) => (
              <div
                key={`${rowIndex}-${columnIndex}`}
                className="col-6 md:col"
              >
                <Skeleton width="100%" height="1.2rem" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ClientOnly = ({ children, fallback = null }: ClientOnlyProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface ClientOnlyDataTableProps extends DataTableSkeletonProps {
  children: ReactNode;
}

const ClientOnlyDataTable = ({
  children,
  ...skeletonProps
}: ClientOnlyDataTableProps) => {
  return (
    <ClientOnly fallback={<DataTableSkeleton {...skeletonProps} />}>
      {children}
    </ClientOnly>
  );
};

export default ClientOnlyDataTable;
