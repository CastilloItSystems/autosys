"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { getUsers } from "@/modules/users/services/user.service";

interface TechnicianSelectorProps {
  value: string | null | undefined;
  onChange: (id: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
}

export default function TechnicianSelector({
  value,
  onChange,
  disabled = false,
  invalid = false,
  placeholder = "Seleccionar técnico...",
}: TechnicianSelectorProps) {
  const [technicians, setTechnicians] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUsers()
      .then((res) => {
        if (!cancelled) {
          const users = res?.users ?? [];
          setTechnicians(
            users
              .filter(
                (u) => u.isTechnician && u.status === "active" && !u.deleted,
              )
              .map((u) => ({ id: u.id, name: u.name })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setTechnicians([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(
    () => technicians.map((t) => ({ label: t.name, value: t.id })),
    [technicians],
  );

  return (
    <Dropdown
      value={value ?? null}
      onChange={(e) => onChange(e.value)}
      options={options}
      placeholder={loading ? "Cargando técnicos..." : placeholder}
      disabled={disabled || loading}
      className={invalid ? "p-invalid w-full" : "w-full"}
      filter
      showClear
      emptyMessage="No hay técnicos disponibles"
      emptyFilterMessage="Sin resultados"
    />
  );
}
