"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { getUsers } from "@/app/api/userService";

interface UserSelectorProps {
  value: string | null | undefined;
  onChange: (id: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
}

export default function UserSelector({
  value,
  onChange,
  disabled = false,
  invalid = false,
  placeholder = "Seleccionar usuario...",
}: UserSelectorProps) {
  const [users, setUsers] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUsers()
      .then((res) => {
        if (!cancelled) {
          const list = res?.users ?? [];
          setUsers(
            list
              .filter((u) => u.estado === "activo" && !u.eliminado)
              .map((u) => ({ id: u.id, nombre: u.nombre })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(
    () => users.map((u) => ({ label: u.nombre, value: u.id })),
    [users],
  );

  return (
    <Dropdown
      value={value ?? null}
      onChange={(e) => onChange(e.value)}
      options={options}
      placeholder={loading ? "Cargando usuarios..." : placeholder}
      disabled={disabled || loading}
      className={invalid ? "p-invalid w-full" : "w-full"}
      filter
      showClear
      emptyMessage="No hay usuarios disponibles"
      emptyFilterMessage="Sin resultados"
    />
  );
}
