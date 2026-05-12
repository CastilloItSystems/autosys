"use client";

export interface ApprovalTrailEntry {
  label: string;
  name?: string | null;
  date?: string | Date | null;
  refLabel?: string;
  refValue?: string;
  icon?: string;
}

interface Props {
  entries: ApprovalTrailEntry[];
  className?: string;
}

function formatDateTime(date?: string | Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ApprovalTrail({ entries, className }: Props) {
  const visible = entries.filter((e) => e.name || e.date);
  if (visible.length === 0) return null;

  return (
    <div
      className={`border-round surface-50 border-1 surface-border p-3 ${className ?? ""}`}
    >
      <div className="flex align-items-center gap-2 mb-2">
        <i className="pi pi-history text-primary" />
        <span className="font-semibold text-sm text-700">Trazabilidad</span>
      </div>
      <div className="flex flex-column gap-2">
        {visible.map((entry, idx) => (
          <div key={idx} className="flex align-items-start gap-2">
            <i
              className={`${entry.icon ?? "pi pi-user-check"} text-primary mt-1`}
              style={{ fontSize: "0.85rem" }}
            />
            <div className="flex flex-column">
              <span className="text-sm">
                <span className="text-600">{entry.label}: </span>
                <span className="font-medium">{entry.name ?? "—"}</span>
                {entry.date && (
                  <span className="text-500 ml-2 text-xs">
                    {formatDateTime(entry.date)}
                  </span>
                )}
              </span>
              {entry.refLabel && entry.refValue && (
                <span className="text-xs text-500">
                  {entry.refLabel}: {entry.refValue}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
