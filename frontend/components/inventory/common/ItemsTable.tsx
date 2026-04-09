"use client";
import React, { ReactNode, useRef, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFieldArrayMove,
} from "react-hook-form";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import TotalsFooter, { TotalsLine } from "./TotalsFooter";

interface SortableRowProps {
  id: string;
  renderContent: (opts: {
    dragHandleProps: Record<string, unknown>;
    isDragging: boolean;
  }) => ReactNode;
}

function SortableRow({ id, renderContent }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {renderContent({
        dragHandleProps: {
          ...(attributes as unknown as Record<string, unknown>),
          ...(listeners ?? {}),
        },
        isDragging,
      })}
    </div>
  );
}

export interface ColumnDef {
  label: string;
  style: React.CSSProperties;
}

export interface ItemsTableRenderRowProps {
  field: FieldArrayWithId<any, any, "id">;
  index: number;
  onAddRow: () => void;
  dragHandleProps: Record<string, unknown>;
  isDragging: boolean;
  autoFocus: boolean;
}

interface ItemsTableProps {
  fields: FieldArrayWithId<any, any, "id">[];
  append: UseFieldArrayAppend<any, any>;
  remove: UseFieldArrayRemove;
  move: UseFieldArrayMove;
  defaultItem: Record<string, unknown>;
  columns: ColumnDef[];
  renderRow: (props: ItemsTableRenderRowProps) => ReactNode;
  title?: string;
  totals?: TotalsLine[];
  currency?: string;
  disabled?: boolean;
  /** Minimum width in px before horizontal scroll kicks in. Default: 600 */
  minWidth?: number;
}

export default function ItemsTable({
  fields,
  append,
  remove,
  move,
  defaultItem,
  columns,
  renderRow,
  title = "Artículos",
  totals,
  currency = "USD",
  disabled = false,
  minWidth = 600,
}: ItemsTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const justAddedRef = useRef(false);

  useEffect(() => {
    justAddedRef.current = false;
  }, [fields.length]);

  const handleAddRow = () => {
    justAddedRef.current = true;
    append(defaultItem);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeIndex = fields.findIndex((f) => f.id === String(active.id));
    const overIndex = fields.findIndex((f) => f.id === String(over.id));
    if (activeIndex !== -1 && overIndex !== -1) {
      move(activeIndex, overIndex);
    }
  };

  return (
    <div className="col-12">
      {/* ── Section header ── */}
      <Divider align="left" className="my-0">
        <div className="flex align-items-center gap-2">
          <span className="p-tag">{title}</span>
          {!disabled && (
            <Button
              type="button"
              icon="pi pi-plus"
              className="p-button-rounded p-button-text p-button-sm"
              onClick={handleAddRow}
              tooltip="Añadir ítem"
              tooltipOptions={{ position: "top" }}
            />
          )}
        </div>
      </Divider>

      {/* ── Spreadsheet-style table ── */}
      <div
        style={{
          border: "1px solid var(--surface-300)",
          borderRadius: "6px",
          overflowX: "auto",
        }}
      >
        <div style={{ minWidth: `${minWidth}px` }}>
        {/* Column headers — rendered by ItemsTable from columns prop */}
        {columns.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 8px",
              backgroundColor: "var(--surface-100)",
              borderBottom: "2px solid var(--surface-300)",
            }}
          >
            {columns.map((col, i) => (
              <div
                key={i}
                style={{
                  ...col.style,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                  color: "var(--text-color-secondary)",
                  userSelect: "none" as const,
                  flexShrink: col.style.flexShrink ?? 0,
                }}
              >
                {col.label}
              </div>
            ))}
          </div>
        )}

        {/* Sortable rows */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {fields.map((field, index) => (
              <SortableRow
                key={field.id}
                id={field.id}
                renderContent={({ dragHandleProps, isDragging }) =>
                  renderRow({
                    field,
                    index,
                    onAddRow: handleAddRow,
                    dragHandleProps,
                    isDragging,
                    autoFocus: justAddedRef.current && index === fields.length - 1,
                  })
                }
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add row — inside table, bottom row */}
        {!disabled && (
          <div
            style={{
              padding: "4px 8px",
              borderTop: "1px dashed var(--surface-300)",
            }}
          >
            <Button
              type="button"
              icon="pi pi-plus"
              label="Añadir ítem"
              className="p-button-text p-button-sm p-button-secondary"
              style={{ height: "1.75rem", fontSize: "0.8rem" }}
              onClick={handleAddRow}
            />
          </div>
        )}
        </div>
      </div>

      {/* ── Optional totals footer (outside the table border) ── */}
      {totals && totals.length > 0 && (
        <TotalsFooter lines={totals} currency={currency} />
      )}
    </div>
  );
}
