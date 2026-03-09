"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import {
  getUserPermissions,
  setUserPermissions,
  UserPermissionsResponse,
  PermissionOverride,
} from "@/app/api/userService";

// ── Agrupación visual de permisos ──────────────────────────────────────────
const PERMISSION_GROUPS: { label: string; icon: string; prefix: string }[] = [
  { label: "Inventario", icon: "pi pi-box", prefix: "inventory" },
  { label: "Artículos", icon: "pi pi-tag", prefix: "items" },
  { label: "Almacenes", icon: "pi pi-building", prefix: "warehouses" },
  { label: "Movimientos", icon: "pi pi-arrows-v", prefix: "movements" },
  { label: "Stock", icon: "pi pi-chart-bar", prefix: "stock" },
  { label: "Órdenes de Compra", icon: "pi pi-shopping-cart", prefix: "purchase_orders" },
  { label: "Ventas", icon: "pi pi-dollar", prefix: "sales" },
  { label: "Notas de Salida", icon: "pi pi-external-link", prefix: "exit_notes" },
  { label: "Pagos", icon: "pi pi-credit-card", prefix: "payments" },
  { label: "Facturas", icon: "pi pi-file", prefix: "invoices" },
  { label: "Préstamos", icon: "pi pi-arrow-right-arrow-left", prefix: "loans" },
  { label: "Reportes", icon: "pi pi-chart-line", prefix: "reports" },
  { label: "Usuarios", icon: "pi pi-users", prefix: "users" },
  { label: "Empresa", icon: "pi pi-briefcase", prefix: "empresa" },
  { label: "Configuración", icon: "pi pi-cog", prefix: "settings" },
];

const PERMISSION_LABELS: Record<string, string> = {
  "inventory:view": "Ver",
  "inventory:create": "Crear",
  "inventory:update": "Editar",
  "inventory:delete": "Eliminar",
  "items:view": "Ver",
  "items:create": "Crear",
  "items:update": "Editar",
  "items:delete": "Eliminar",
  "warehouses:view": "Ver",
  "warehouses:create": "Crear",
  "warehouses:update": "Editar",
  "warehouses:delete": "Eliminar",
  "movements:view": "Ver",
  "movements:create": "Registrar",
  "movements:update": "Editar",
  "movements:delete": "Eliminar",
  "stock:view": "Ver",
  "stock:adjust": "Ajustar",
  "stock:transfer": "Transferir",
  "purchase_orders:view": "Ver",
  "purchase_orders:create": "Crear",
  "purchase_orders:approve": "Aprobar",
  "purchase_orders:receive": "Recibir",
  "purchase_orders:cancel": "Cancelar",
  "sales:view": "Ver",
  "sales:create": "Crear",
  "sales:approve": "Aprobar",
  "sales:cancel": "Cancelar",
  "exit_notes:view": "Ver",
  "exit_notes:create": "Crear",
  "exit_notes:prepare": "Preparar",
  "exit_notes:deliver": "Entregar",
  "payments:view": "Ver",
  "payments:create": "Registrar",
  "payments:cancel": "Cancelar",
  "invoices:view": "Ver",
  "invoices:create": "Crear",
  "invoices:cancel": "Cancelar",
  "loans:view": "Ver",
  "loans:create": "Crear",
  "loans:approve": "Aprobar",
  "loans:activate": "Activar",
  "loans:return": "Devolver",
  "loans:cancel": "Cancelar",
  "reports:view": "Ver",
  "reports:export": "Exportar",
  "users:view": "Ver",
  "users:create": "Crear",
  "users:update": "Editar",
  "users:delete": "Eliminar",
  "empresa:view": "Ver",
  "empresa:create": "Crear",
  "empresa:update": "Editar",
  "empresa:delete": "Eliminar",
  "settings:view": "Ver",
  "settings:update": "Editar",
};

// ── Tipos de estado local para cada permiso ────────────────────────────────
type PermissionState = "role" | "granted" | "revoked";

interface UsuarioPermisosProps {
  visible: boolean;
  onHide: () => void;
  userId: string;
  userName: string;
  toast: React.RefObject<Toast | null>;
}

const UsuarioPermisos = ({
  visible,
  onHide,
  userId,
  userName,
  toast,
}: UsuarioPermisosProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<UserPermissionsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // permissionState: "role" = sin override, "granted" = GRANT, "revoked" = REVOKE
  const [permStates, setPermStates] = useState<Record<string, PermissionState>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getUserPermissions(userId);
      setData(res);

      // Inicializar estados desde los overrides existentes
      const states: Record<string, PermissionState> = {};
      const reasonMap: Record<string, string> = {};

      for (const perm of res.allPermissions) {
        states[perm] = "role"; // default: heredado del rol
      }
      for (const override of res.overrides) {
        states[override.permission] = override.action === "GRANT" ? "granted" : "revoked";
        if (override.reason) reasonMap[override.permission] = override.reason;
      }

      setPermStates(states);
      setReasons(reasonMap);
      setDirty(false);
    } catch (err: any) {
      console.error("UsuarioPermisos load error:", err, "status:", err?.response?.status, "msg:", err?.message);
      const status = err?.response?.status;
      const isUnauthorized = status === 401 || err?.message === "Unauthorized";
      const msg = isUnauthorized
          ? "Sesión expirada. Por favor cierra sesión e inicia de nuevo."
          : status === 403
          ? "No tienes permisos para gestionar los permisos de este usuario. Inicia sesión como administrador."
          : `Error ${status ?? "de red"}: ${err?.response?.data?.error ?? err?.message ?? "Error desconocido"}`;
      setLoadError(msg);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: msg,
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const togglePermission = (perm: string) => {
    setPermStates((prev) => {
      const current = prev[perm];
      const hasRole = data?.rolePermissions.includes(perm) ?? false;

      let next: PermissionState;
      if (current === "role") {
        // Si viene del rol → si el rol lo tiene, siguiente es REVOKE; si no, es GRANT
        next = hasRole ? "revoked" : "granted";
      } else if (current === "granted") {
        next = "revoked";
      } else {
        // revoked → volver al estado del rol
        next = "role";
      }

      setDirty(true);
      return { ...prev, [perm]: next };
    });
  };

  const handleSave = async () => {
    if (!dirty) {
      onHide();
      return;
    }

    setSaving(true);
    try {
      // Solo enviar overrides (GRANT/REVOKE), ignorar los que son "role"
      const overrides: Omit<PermissionOverride, "id">[] = Object.entries(
        permStates
      )
        .filter(([, state]) => state !== "role")
        .map(([permission, state]) => ({
          permission,
          action: state === "granted" ? "GRANT" : "REVOKE",
          reason: reasons[permission] || undefined,
        }));

      await setUserPermissions(userId, overrides);

      toast.current?.show({
        severity: "success",
        summary: "Permisos guardados",
        detail: `Permisos de ${userName} actualizados exitosamente`,
        life: 3000,
      });

      setDirty(false);
      await load();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron guardar los permisos",
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const renderPermissionButton = (perm: string) => {
    const state = permStates[perm] ?? "role";
    const hasRole = data?.rolePermissions.includes(perm) ?? false;
    const label = PERMISSION_LABELS[perm] ?? perm.split(":")[1];

    let icon = "pi pi-minus";
    let classes = "p-button-sm ";
    let tooltip = "Heredado del rol";

    if (state === "granted") {
      icon = "pi pi-check-circle";
      classes += "p-button-success";
      tooltip = "Permiso concedido individualmente (click para revocar)";
    } else if (state === "revoked") {
      icon = "pi pi-times-circle";
      classes += "p-button-danger";
      tooltip = "Permiso revocado individualmente (click para restaurar)";
    } else if (hasRole) {
      icon = "pi pi-check";
      classes += "p-button-outlined p-button-success";
      tooltip = "Viene del rol (click para revocar)";
    } else {
      icon = "pi pi-times";
      classes += "p-button-outlined p-button-secondary";
      tooltip = "No tiene este permiso (click para conceder)";
    }

    return (
      <Button
        key={perm}
        label={label}
        icon={icon}
        className={classes}
        onClick={() => togglePermission(perm)}
        tooltip={tooltip}
        tooltipOptions={{ position: "top" }}
        size="small"
      />
    );
  };

  const filteredGroups = PERMISSION_GROUPS.filter((group) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      group.label.toLowerCase().includes(term) ||
      (data?.allPermissions ?? []).some(
        (p) =>
          p.startsWith(group.prefix + ":") &&
          (p.toLowerCase().includes(term) ||
            (PERMISSION_LABELS[p] ?? "").toLowerCase().includes(term))
      )
    );
  });

  return (
    <Dialog
      visible={visible}
      style={{ width: "900px" }}
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-shield text-primary text-xl" />
          <div>
            <div className="font-bold text-lg">Permisos de Usuario</div>
            <div className="text-500 text-sm font-normal">{userName}</div>
          </div>
        </div>
      }
      modal
      maximizable
      onHide={onHide}
      footer={
        <div className="flex justify-content-between align-items-center w-full">
          <div className="text-sm text-500">
            {dirty && (
              <span className="text-orange-500 font-medium">
                <i className="pi pi-exclamation-circle mr-1" />
                Hay cambios sin guardar
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              text
              onClick={onHide}
              disabled={saving}
            />
            <Button
              label={saving ? "Guardando..." : "Guardar Permisos"}
              icon={saving ? "pi pi-spin pi-spinner" : "pi pi-save"}
              onClick={handleSave}
              loading={saving}
              disabled={!dirty}
            />
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-column align-items-center justify-content-center p-6">
          <ProgressSpinner style={{ width: "40px", height: "40px" }} />
          <p className="text-500 mt-3">Cargando permisos...</p>
        </div>
      ) : loadError ? (
        <div className="flex flex-column align-items-center justify-content-center p-6 gap-3">
          <i className="pi pi-lock text-red-400" style={{ fontSize: "3rem" }} />
          <p className="text-center text-700 font-medium m-0">{loadError}</p>
          <Button
            label="Reintentar"
            icon="pi pi-refresh"
            outlined
            size="small"
            onClick={load}
          />
        </div>
      ) : data ? (
        <div className="flex flex-column gap-3">
          {/* ── Leyenda y stats ── */}
          <div className="grid">
            <div className="col-12 md:col-4">
              <div className="surface-100 border-round p-3 text-center">
                <div className="text-primary font-bold text-2xl">
                  {data.effectivePermissions.length}
                </div>
                <div className="text-500 text-sm">Permisos efectivos</div>
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="surface-100 border-round p-3 text-center">
                <div className="text-green-500 font-bold text-2xl">
                  {data.overrides.filter((o) => o.action === "GRANT").length}
                </div>
                <div className="text-500 text-sm">Concedidos extra</div>
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="surface-100 border-round p-3 text-center">
                <div className="text-red-500 font-bold text-2xl">
                  {data.overrides.filter((o) => o.action === "REVOKE").length}
                </div>
                <div className="text-500 text-sm">Revocados</div>
              </div>
            </div>
          </div>

          {/* ── Leyenda ── */}
          <div className="flex flex-wrap gap-2 align-items-center p-3 surface-50 border-round">
            <span className="text-500 text-sm font-medium mr-2">Leyenda:</span>
            <Tag value="Del rol" severity="success" icon="pi pi-check" />
            <Tag value="No tiene" severity="secondary" icon="pi pi-times" />
            <Tag value="Concedido +" severity="success" icon="pi pi-check-circle" />
            <Tag value="Revocado ✕" severity="danger" icon="pi pi-times-circle" />
            <span className="text-400 text-xs ml-2">
              (Haz click en cada permiso para cambiar su estado)
            </span>
          </div>

          {/* ── Buscador ── */}
          <span className="p-input-icon-left w-full">
            <i className="pi pi-search" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar permisos o módulos..."
              className="w-full"
            />
          </span>

          {/* ── Grupos de permisos ── */}
          {filteredGroups.map((group) => {
            const groupPerms = (data.allPermissions ?? []).filter((p) =>
              p.startsWith(group.prefix + ":")
            );
            if (groupPerms.length === 0) return null;

            const activeCount = groupPerms.filter((p) => {
              const state = permStates[p] ?? "role";
              const hasRole = data.rolePermissions.includes(p);
              return (
                (state === "role" && hasRole) || state === "granted"
              );
            }).length;

            return (
              <div key={group.prefix} className="surface-50 border-round p-3">
                <div className="flex align-items-center justify-content-between mb-3">
                  <div className="flex align-items-center gap-2">
                    <i className={`${group.icon} text-primary`} />
                    <span className="font-semibold text-900">{group.label}</span>
                  </div>
                  <Tag
                    value={`${activeCount}/${groupPerms.length}`}
                    severity={
                      activeCount === groupPerms.length
                        ? "success"
                        : activeCount === 0
                          ? "secondary"
                          : "warning"
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {groupPerms.map((perm) => renderPermissionButton(perm))}
                </div>
              </div>
            );
          })}

          {filteredGroups.length === 0 && (
            <div className="text-center text-500 p-4">
              <i className="pi pi-search text-4xl mb-2" style={{ display: "block" }} />
              No se encontraron permisos para "{search}"
            </div>
          )}
        </div>
      ) : null}
    </Dialog>
  );
};

export default UsuarioPermisos;
