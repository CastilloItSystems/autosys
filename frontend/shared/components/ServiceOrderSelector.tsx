"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import serviceOrderService from "@/app/api/workshop/serviceOrderService";
import type {
  ServiceOrder,
  ServiceOrderStatus,
} from "@/libs/interfaces/workshop";

const ACTIVE_STATUSES: ServiceOrderStatus[] = [
  "OPEN",
  "DIAGNOSING",
  "PENDING_APPROVAL",
  "APPROVED",
  "IN_PROGRESS",
  "PAUSED",
  "WAITING_PARTS",
  "WAITING_AUTH",
  "QUALITY_CHECK",
  "READY",
];

interface ServiceOrderSelectorProps {
  value: string | null | undefined;
  onChange: (id: string) => void;
  statusFilter?: ServiceOrderStatus[];
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
}

export default function ServiceOrderSelector({
  value,
  onChange,
  statusFilter = ACTIVE_STATUSES,
  disabled = false,
  invalid = false,
  placeholder = "Seleccionar orden de trabajo...",
}: ServiceOrderSelectorProps) {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    serviceOrderService
      .getAll({ limit: 100 })
      .then((res) => {
        if (!cancelled) {
          const data = Array.isArray(res?.data) ? res.data : [];
          setOrders(
            statusFilter.length
              ? data.filter((o) => statusFilter.includes(o.status))
              : data,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(
    () =>
      orders.map((o) => {
        const vehicle = o.vehiclePlate ?? o.vehicleDesc ?? "Sin vehículo";
        const customer = o.customer?.name ?? "Sin cliente";
        return {
          label: `${o.folio} · ${vehicle} · ${customer}`,
          value: o.id,
        };
      }),
    [orders],
  );

  return (
    <Dropdown
      value={value ?? null}
      options={options}
      onChange={(e) => onChange(e.value)}
      placeholder={loading ? "Cargando órdenes..." : placeholder}
      disabled={disabled || loading}
      filter
      showClear
      filterPlaceholder="Buscar por folio, vehículo..."
      className={invalid ? "p-invalid" : ""}
      emptyMessage="No hay órdenes activas"
      emptyFilterMessage="Sin resultados"
    />
  );
}
