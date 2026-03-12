"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";

import {
  getMembershipPermissions,
  setMembershipPermissions,
  MembershipPermissionOverride,
  MembershipPermissionsResponse,
} from "@/app/api/userService";

// ── Catálogo de permisos (igual que EmpresaRoles.tsx) ─────────────────────

const PERMISSION_GROUPS = [
  { label: "Usuarios", icon: "pi pi-users", prefix: "users" },
  { label: "Inventario", icon: "pi pi-box", prefix: "inventory" },
  { label: "Artículos", icon: "pi pi-tag", prefix: "items" },
  { label: "Almacenes", icon: "pi pi-database", prefix: "warehouses" },
  { label: "Stock", icon: "pi pi-chart-bar", prefix: "stock" },
  { label: "Movimientos", icon: "pi pi-arrows-h", prefix: "movements" },
  { label: "Préstamos", icon: "pi pi-share-alt", prefix: "loans" },
  { label: "Transferencias", icon: "pi pi-send", prefix: "transfers" },
  { label: "Clientes", icon: "pi pi-id-card", prefix: "customers" },
  { label: "Órdenes", icon: "pi pi-shopping-cart", prefix: "orders" },
  { label: "Facturas", icon: "pi pi-file", prefix: "invoices" },
  { label: "Cotizaciones", icon: "pi pi-file-edit", prefix: "quotes" },
  { label: "Pagos", icon: "pi pi-credit-card", prefix: "payments" },
  { label: "Reportes", icon: "pi pi-chart-line", prefix: "reports" },
];

const PERMISSION_LABELS: Record<string, string> = {
  // Usuarios
  "users.view": "Ver",
  "users.create": "Crear",
  "users.update": "Editar",
  "users.delete": "Eliminar",
  "users.approve": "Aprobar",
  // Inventario
  "inventory.view": "Ver",
  "inventory.create": "Crear",
  "inventory.update": "Editar",
  "inventory.delete": "Eliminar",
  "inventory.approve": "Aprobar",
  // Artículos
  "items.view": "Ver",
  "items.create": "Crear",
  "items.update": "Editar",
  "items.delete": "Eliminar",
  "items.approve": "Aprobar",
  // Almacenes
  "warehouses.view": "Ver",
  "warehouses.create": "Crear",
  "warehouses.update": "Editar",
  "warehouses.delete": "Eliminar",
  "warehouses.approve": "Aprobar",
  // Stock
  "stock.view": "Ver",
  "stock.adjust": "Ajustar",
  "stock.transfer": "Transferir",
  "stock.approve": "Aprobar",
  // Movimientos
  "movements.view": "Ver",
  "movements.create": "Crear",
  "movements.update": "Editar",
  "movements.delete": "Eliminar",
  "movements.approve": "Aprobar",
  // Préstamos
  "loans.view": "Ver",
  "loans.create": "Crear",
  "loans.update": "Editar",
  "loans.delete": "Eliminar",
  "loans.approve": "Aprobar",
  // Transferencias
  "transfers.view": "Ver",
  "transfers.create": "Crear",
  "transfers.update": "Editar",
  "transfers.delete": "Eliminar",
  "transfers.approve": "Aprobar",
  // Clientes
  "customers.view": "Ver",
  "customers.create": "Crear",
  "customers.update": "Editar",
  "customers.delete": "Eliminar",
  "customers.approve": "Aprobar",
  // Órdenes
  "orders.view": "Ver",
  "orders.create": "Crear",
  "orders.update": "Editar",
  "orders.delete": "Eliminar",
  "orders.approve": "Aprobar",
  // Facturas
  "invoices.view": "Ver",
  "invoices.create": "Crear",
  "invoices.update": "Editar",
  "invoices.delete": "Eliminar",
  "invoices.approve": "Aprobar",
  // Cotizaciones
  "quotes.view": "Ver",
  "quotes.create": "Crear",
  "quotes.update": "Editar",
  "quotes.delete": "Eliminar",
  "quotes.approve": "Aprobar",
  // Pagos
  "payments.view": "Ver",
  "payments.create": "Crear",
  "payments.update": "Editar",
  "payments.delete": "Eliminar",
  "payments.approve": "Aprobar",
  // Reportes
  "reports.view": "Ver",
  "reports.export": "Exportar",
  "reports.approve": "Aprobar",
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS);

// ── Tipos ─────────────────────────────────────────────────────────────────

type OverrideState = "inherit" | "grant" | "revoke";

interface MembershipPermissionsProps {
  visible: boolean;
  onHide: () => void;
  membershipId: string;
  membershipLabel: string; // e.g. "Juan Pérez — Empresa Acme"
  toast: React.RefObject<Toast | null>;
}

// ── Componente ────────────────────────────────────────────────────────────

const MembershipPermissions = ({
  visible,
  onHide,
  membershipId,
  membershipLabel,
  toast,
}: MembershipPermissionsProps) => {
  const [data, setData] = useState<MembershipPermissionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [states, setStates] = useState<Record<string, OverrideState>>({});
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    if (!membershipId) return;
    setLoading(true);
    try {
      const res = await getMembershipPermissions(membershipId);
      setData(res);

      // Inicializar estados desde overrides existentes
      const initial: Record<string, OverrideState> = {};
      for (const perm of ALL_PERMISSIONS) {
        initial[perm] = "inherit";
      }
      for (const override of res.overrides) {
        initial[override.permissionCode] =
          override.action === "GRANT" ? "grant" : "revoke";
      }
      setStates(initial);
      setDirty(false);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los permisos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [membershipId, toast]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  // Cicla: inherit → grant → revoke → inherit
  const cycleState = (perm: string) => {
    setStates((prev) => {
      const current = prev[perm] ?? "inherit";
      const next: OverrideState =
        current === "inherit"
          ? "grant"
          : current === "grant"
          ? "revoke"
          : "inherit";
      return { ...prev, [perm]: next };
    });
    setDirty(true);
  };

  const resetAll = () => {
    const cleared: Record<string, OverrideState> = {};
    for (const perm of ALL_PERMISSIONS) cleared[perm] = "inherit";
    setStates(cleared);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const overrides: MembershipPermissionOverride[] = Object.entries(states)
        .filter(([, s]) => s !== "inherit")
        .map(([code, s]) => ({
          permissionCode: code,
          action: s === "grant" ? "GRANT" : "REVOKE",
        }));

      await setMembershipPermissions(membershipId, overrides);
      toast.current?.show({
        severity: "success",
        summary: "Guardado",
        detail: "Permisos individuales actualizados",
        life: 3000,
      });
      setDirty(false);
      await load();
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err?.response?.data?.error ?? "No se pudieron guardar los permisos",
        life: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Filtrado por búsqueda ─────────────────────────────────────────────

  const filteredGroups = PERMISSION_GROUPS.filter((g) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return (
      g.label.toLowerCase().includes(t) ||
      ALL_PERMISSIONS.some(
        (p) =>
          p.startsWith(g.prefix + ".") &&
          (p.includes(t) ||
            (PERMISSION_LABELS[p] ?? "").toLowerCase().includes(t)),
      )
    );
  });

  const grants = Object.values(states).filter((s) => s === "grant").length;
  const revokes = Object.values(states).filter((s) => s === "revoke").length;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Dialog
      visible={visible}
      style={{ width: "1000px" }}
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-lock text-primary text-xl" />
          <div>
            <div className="font-bold text-lg">Permisos individuales</div>
            <div className="text-500 text-sm font-normal">
              {membershipLabel}
            </div>
          </div>
        </div>
      }
      modal
      maximizable
      onHide={onHide}
      footer={
        <div className="flex justify-content-between align-items-center w-full">
          <div className="flex gap-3 text-sm text-600">
            {data && (
              <>
                <span>
                  Rol base: <b>{data.roleName}</b>
                </span>
                <span>·</span>
                <span className="text-green-600 font-medium">
                  +{grants} forzados
                </span>
                <span>·</span>
                <span className="text-red-600 font-medium">
                  −{revokes} bloqueados
                </span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {(grants > 0 || revokes > 0) && (
              <Button
                label="Limpiar overrides"
                icon="pi pi-refresh"
                text
                severity="secondary"
                size="small"
                onClick={resetAll}
                disabled={saving}
              />
            )}
            <Button
              label="Cancelar"
              icon="pi pi-times"
              text
              onClick={onHide}
              disabled={saving}
            />
            <Button
              label="Guardar cambios"
              icon="pi pi-save"
              severity="success"
              onClick={handleSave}
              loading={saving}
              disabled={!dirty}
            />
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="text-center p-5 text-500">Cargando permisos...</div>
      ) : (
        <div className="flex flex-column gap-3">
          {/* Leyenda */}
          <div className="flex gap-4 surface-50 border-round p-3 text-sm flex-wrap">
            <span className="font-semibold text-900">Leyenda:</span>
            <div className="flex align-items-center gap-1 text-500">
              <i className="pi pi-circle" />
              <span>Sin override (hereda del rol)</span>
            </div>
            <div className="flex align-items-center gap-1 text-green-600">
              <i className="pi pi-check-circle" />
              <span>Forzar GRANT (añadir aunque el rol no lo tenga)</span>
            </div>
            <div className="flex align-items-center gap-1 text-red-600">
              <i className="pi pi-ban" />
              <span>Forzar REVOKE (quitar aunque el rol lo tenga)</span>
            </div>
            <span className="text-400 ml-auto">
              Click en un botón para cambiar su estado
            </span>
          </div>

          {/* Buscador */}
          <span className="p-input-icon-left w-full">
            <i className="pi pi-search" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar permiso o módulo..."
              className="w-full"
            />
          </span>

          {/* Grupos */}
          <div
            className="flex flex-column gap-2"
            style={{ maxHeight: "460px", overflowY: "auto" }}
          >
            {filteredGroups.map((group) => {
              const groupPerms = ALL_PERMISSIONS.filter((p) =>
                p.startsWith(group.prefix + "."),
              );
              if (groupPerms.length === 0) return null;

              const groupGrants = groupPerms.filter(
                (p) => states[p] === "grant",
              ).length;
              const groupRevokes = groupPerms.filter(
                (p) => states[p] === "revoke",
              ).length;

              return (
                <div key={group.prefix} className="surface-50 border-round p-3">
                  <div className="flex align-items-center justify-content-between mb-3">
                    <div className="flex align-items-center gap-2">
                      <i className={`${group.icon} text-primary`} />
                      <span className="font-semibold text-900">
                        {group.label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {groupGrants > 0 && (
                        <Tag value={`+${groupGrants}`} severity="success" />
                      )}
                      {groupRevokes > 0 && (
                        <Tag value={`−${groupRevokes}`} severity="danger" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {groupPerms.map((perm) => {
                      const state = states[perm] ?? "inherit";
                      const fromRole =
                        data?.rolePermissions.includes(perm) ?? false;
                      const effective =
                        data?.effectivePermissions.includes(perm) ?? false;

                      let btnIcon = "pi pi-circle";
                      let severity: "secondary" | "success" | "danger" =
                        "secondary";
                      let outlined = true;

                      if (state === "grant") {
                        btnIcon = "pi pi-check-circle";
                        severity = "success";
                        outlined = false;
                      } else if (state === "revoke") {
                        btnIcon = "pi pi-ban";
                        severity = "danger";
                        outlined = false;
                      }

                      const label =
                        PERMISSION_LABELS[perm] ?? perm.split(".")[1];

                      return (
                        <div
                          key={perm}
                          className="flex flex-column align-items-center gap-1"
                        >
                          <Button
                            label={label}
                            icon={btnIcon}
                            severity={severity}
                            outlined={outlined}
                            size="small"
                            onClick={() => cycleState(perm)}
                            tooltip={`${perm}\nRol: ${
                              fromRole ? "✓" : "✗"
                            }  ·  Efectivo: ${effective ? "✓" : "✗"}`}
                            tooltipOptions={{ position: "top" }}
                          />
                          {/* Indicador del rol base */}
                          <span
                            className="text-xs"
                            title={
                              fromRole
                                ? "El rol tiene este permiso"
                                : "El rol no tiene este permiso"
                            }
                          >
                            {fromRole ? (
                              <i
                                className="pi pi-shield text-primary-300"
                                style={{ fontSize: "0.65rem" }}
                              />
                            ) : (
                              <i
                                className="pi pi-minus text-300"
                                style={{ fontSize: "0.65rem" }}
                              />
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default MembershipPermissions;
