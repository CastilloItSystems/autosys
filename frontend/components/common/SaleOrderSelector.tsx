"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import orderService from "@/app/api/sales/orderService";

interface Order {
  id: string;
  orderNumber: string;
}

interface SaleOrderSelectorProps {
  value: string | null | undefined;
  onChange: (id: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
}

export default function SaleOrderSelector({
  value,
  onChange,
  disabled = false,
  invalid = false,
  placeholder = "Seleccionar orden de venta...",
}: SaleOrderSelectorProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    orderService
      .getAll({ limit: 100 })
      .then((res) => {
        if (!cancelled) {
          const data = Array.isArray(res?.data) ? res.data : [];
          setOrders(data);
        }
      })
      .catch((err) => {
        console.error("Error loading sale orders:", err);
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
      orders.map((o) => ({
        label: o.orderNumber,
        value: o.id,
      })),
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
      filterPlaceholder="Buscar por número..."
      className={invalid ? "p-invalid" : ""}
      emptyMessage="No hay órdenes disponibles"
      emptyFilterMessage="Sin resultados"
    />
  );
}
