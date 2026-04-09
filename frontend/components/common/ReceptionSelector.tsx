"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import receptionService from "@/app/api/workshop/receptionService";
import type { VehicleReception } from "@/libs/interfaces/workshop";

interface ReceptionSelectorProps {
  value: string | null | undefined;
  onChange: (id: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
}

export default function ReceptionSelector({
  value,
  onChange,
  disabled = false,
  invalid = false,
  placeholder = "Seleccionar recepción...",
}: ReceptionSelectorProps) {
  const [receptions, setReceptions] = useState<VehicleReception[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    receptionService
      .getAll({ limit: 100 })
      .then((res) => {
        if (!cancelled) setReceptions(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setReceptions([]);
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
      receptions.map((r) => ({
        label: [
          r.folio,
          r.vehiclePlate ?? r.customerVehicle?.plate,
          r.customer?.name,
        ]
          .filter(Boolean)
          .join(" · "),
        value: r.id,
      })),
    [receptions],
  );

  return (
    <Dropdown
      value={value ?? null}
      onChange={(e) => onChange(e.value)}
      options={options}
      placeholder={loading ? "Cargando recepciones..." : placeholder}
      disabled={disabled || loading}
      className={invalid ? "p-invalid w-full" : "w-full"}
      filter
      showClear
      emptyMessage="No hay recepciones disponibles"
      emptyFilterMessage="Sin resultados"
    />
  );
}
