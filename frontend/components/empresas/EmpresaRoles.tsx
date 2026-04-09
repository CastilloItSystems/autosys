"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import CreateButton from "../common/CreateButton";
import {
  getCompanyRoles,
  createCompanyRole,
  updateCompanyRole,
  deleteCompanyRole,
  CompanyRole,
} from "@/app/api/roleService";

import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  ALL_PERMISSIONS,
} from "@/lib/permissions";

type ViewMode = "list" | "create" | "edit";

interface EmpresaRolesProps {
  visible: boolean;
  onHide: () => void;
  empresaId: string;
  empresaNombre: string;
  toast: React.RefObject<Toast | null>;
}

const EmpresaRoles = ({
  visible,
  onHide,
  empresaId,
  empresaNombre,
  toast,
}: EmpresaRolesProps) => {
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingRole, setEditingRole] = useState<CompanyRole | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPermissions, setFormPermissions] = useState<Set<string>>(
    new Set(),
  );
  const [permSearch, setPermSearch] = useState("");

  const loadRoles = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const data = await getCompanyRoles(empresaId);
      setRoles(data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los roles",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (visible) {
      loadRoles();
      setViewMode("list");
    }
  }, [visible, loadRoles]);

  const openCreate = () => {
    setEditingRole(null);
    setFormName("");
    setFormDescription("");
    setFormPermissions(new Set());
    setPermSearch("");
    setViewMode("create");
  };

  const openEdit = (role: CompanyRole) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description ?? "");
    setFormPermissions(new Set(role.permissions));
    setPermSearch("");
    setViewMode("edit");
  };

  const togglePermission = (perm: string) => {
    setFormPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "El nombre del rol es obligatorio",
        life: 3000,
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        permissionCodes: Array.from(formPermissions),
      };
      if (viewMode === "create") {
        await createCompanyRole(empresaId, payload);
        toast.current?.show({
          severity: "success",
          summary: "Rol creado",
          detail: `Rol "${formName}" creado exitosamente`,
          life: 3000,
        });
      } else if (editingRole) {
        await updateCompanyRole(empresaId, editingRole.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Rol actualizado",
          detail: `Rol "${formName}" actualizado`,
          life: 3000,
        });
      }
      await loadRoles();
      setViewMode("list");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "No se pudo guardar el rol";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: msg,
        life: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: CompanyRole) => {
    if (role.isSystem) {
      toast.current?.show({
        severity: "warn",
        summary: "No permitido",
        detail: "Los roles de sistema no se pueden eliminar",
        life: 3000,
      });
      return;
    }
    setDeleting(role.id);
    try {
      await deleteCompanyRole(empresaId, role.id);
      toast.current?.show({
        severity: "success",
        summary: "Rol eliminado",
        detail: `Rol "${role.name}" eliminado`,
        life: 3000,
      });
      await loadRoles();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "No se pudo eliminar el rol";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: msg,
        life: 4000,
      });
    } finally {
      setDeleting(null);
    }
  };

  // Filtrar grupos de permisos según búsqueda
  const filteredGroups = PERMISSION_GROUPS.filter((g) => {
    if (!permSearch) return true;
    const t = permSearch.toLowerCase();
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

  const renderPermissionsEditor = () => (
    <div className="flex flex-column gap-3">
      <div className="grid">
        <div className="col-12 md:col-6">
          <label className="block text-sm font-medium mb-1">
            Nombre del rol *
          </label>
          <InputText
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full"
            placeholder="Ej: Vendedor Senior"
          />
        </div>
        <div className="col-12 md:col-6">
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <InputText
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="w-full"
            placeholder="Descripción opcional"
          />
        </div>
      </div>

      <div className="flex align-items-center justify-content-between">
        <div className="font-semibold text-900">
          Permisos{" "}
          <Tag
            value={`${formPermissions.size}/${ALL_PERMISSIONS.length}`}
            severity={formPermissions.size > 0 ? "success" : "secondary"}
          />
        </div>
        <div className="flex gap-2">
          <Button
            label="Marcar todo"
            size="small"
            text
            onClick={() => setFormPermissions(new Set(ALL_PERMISSIONS))}
          />
          <Button
            label="Limpiar todo"
            size="small"
            text
            severity="secondary"
            onClick={() => setFormPermissions(new Set())}
          />
        </div>
      </div>

      <span className="p-input-icon-left w-full">
        <i className="pi pi-search" />
        <InputText
          value={permSearch}
          onChange={(e) => setPermSearch(e.target.value)}
          placeholder="Buscar permisos..."
          className="w-full"
        />
      </span>

      <div
        className="flex flex-column gap-2"
        style={{ maxHeight: "380px", overflowY: "auto" }}
      >
        {filteredGroups.map((group) => {
          const groupPerms = ALL_PERMISSIONS.filter((p) =>
            p.startsWith(group.prefix + "."),
          );
          if (groupPerms.length === 0) return null;
          const activeCount = groupPerms.filter((p) =>
            formPermissions.has(p),
          ).length;
          const allSelected = activeCount === groupPerms.length;

          return (
            <div key={group.prefix} className="surface-50 border-round p-3">
              <div className="flex align-items-center justify-content-between mb-2">
                <div className="flex align-items-center gap-2">
                  <i className={`${group.icon} text-primary`} />
                  <span className="font-semibold text-900 text-sm">
                    {group.label}
                  </span>
                </div>
                <div className="flex align-items-center gap-2">
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
                  <Button
                    label={allSelected ? "Quitar todos" : "Marcar todos"}
                    size="small"
                    text
                    onClick={() => {
                      setFormPermissions((prev) => {
                        const next = new Set(prev);
                        if (allSelected)
                          groupPerms.forEach((p) => next.delete(p));
                        else groupPerms.forEach((p) => next.add(p));
                        return next;
                      });
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {groupPerms.map((perm) => {
                  const active = formPermissions.has(perm);
                  return (
                    <Button
                      key={perm}
                      label={PERMISSION_LABELS[perm] ?? perm.split(".")[1]}
                      icon={active ? "pi pi-check-circle" : "pi pi-circle"}
                      className={`p-button-sm ${
                        active
                          ? "p-button-success"
                          : "p-button-outlined p-button-secondary"
                      }`}
                      onClick={() => togglePermission(perm)}
                      size="small"
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const dialogHeader = (
    <div className="flex align-items-center gap-2">
      <i className="pi pi-shield text-primary text-xl" />
      <div>
        <div className="font-bold text-lg">Roles de Empresa</div>
        <div className="text-500 text-sm font-normal">{empresaNombre}</div>
      </div>
    </div>
  );

  const dialogFooter =
    viewMode === "list" ? (
      <Button
        label="Cerrar"
        icon="pi pi-times"
        severity="secondary"
        onClick={onHide}
        className="mb-4"
      />
    ) : (
      <div className="flex justify-content-end gap-2 mb-4">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          onClick={() => setViewMode("list")}
          disabled={saving}
        />
        <Button
          label={
            saving
              ? "Guardando..."
              : viewMode === "create"
              ? "Crear Rol"
              : "Guardar Cambios"
          }
          icon={saving ? "pi pi-spin pi-spinner" : "pi pi-save"}
          onClick={handleSave}
          loading={saving}
        />
      </div>
    );

  return (
    <Dialog
      visible={visible}
      style={{ width: "950px" }}
      header={dialogHeader}
      modal
      maximizable
      onHide={onHide}
      footer={dialogFooter}
    >
      {viewMode === "list" ? (
        loading ? (
          <div className="flex flex-column align-items-center justify-content-center p-6">
            <ProgressSpinner style={{ width: "40px", height: "40px" }} />
            <p className="text-500 mt-3">Cargando roles...</p>
          </div>
        ) : (
          <div className="flex flex-column gap-3">
            <div className="flex justify-content-between align-items-center">
              <span className="text-500 text-sm">
                {roles.length} rol(es) configurados para esta empresa
              </span>
              <CreateButton
                label="Nuevo Rol"
                onClick={openCreate}
                tooltip="Agregar Nuevo Rol"
              />
            </div>

            <DataTable
              value={roles}
              size="small"
              emptyMessage="No hay roles configurados."
            >
              <Column
                header="Nombre"
                body={(row: CompanyRole) => (
                  <div className="flex align-items-center gap-2">
                    <span className="font-semibold">{row.name}</span>
                    {row.isSystem && <Tag value="Sistema" severity="info" />}
                  </div>
                )}
              />
              <Column
                header="Descripción"
                field="description"
                body={(row: CompanyRole) =>
                  row.description || <span className="text-400">—</span>
                }
              />
              <Column
                header="Permisos"
                body={(row: CompanyRole) => (
                  <Tag
                    value={`${row.permissions.length} permisos`}
                    severity={
                      row.permissions.length > 0 ? "success" : "secondary"
                    }
                  />
                )}
              />
              <Column
                header="Usuarios"
                body={(row: CompanyRole) => (
                  <Tag
                    value={`${row._count?.userEmpresaRoles ?? 0} usuarios`}
                    severity={
                      (row._count?.userEmpresaRoles ?? 0) > 0
                        ? "warning"
                        : "secondary"
                    }
                  />
                )}
              />
              <Column
                header="Acciones"
                body={(row: CompanyRole) => (
                  <div className="flex gap-1">
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-text p-button-primary"
                      tooltip="Editar permisos"
                      tooltipOptions={{ position: "top" }}
                      onClick={() => openEdit(row)}
                      size="small"
                    />
                    <Button
                      icon="pi pi-trash"
                      className="p-button-rounded p-button-text p-button-danger"
                      tooltip={
                        row.isSystem
                          ? "No se puede eliminar un rol de sistema"
                          : "Eliminar rol"
                      }
                      tooltipOptions={{ position: "top" }}
                      onClick={() => handleDelete(row)}
                      loading={deleting === row.id}
                      disabled={
                        row.isSystem || (row._count?.userEmpresaRoles ?? 0) > 0
                      }
                      size="small"
                    />
                  </div>
                )}
              />
            </DataTable>

            <div className="text-xs text-400 mt-1">
              <i className="pi pi-info-circle mr-1" />
              Los roles de sistema no se pueden eliminar. Los roles con usuarios
              asignados tampoco.
            </div>
          </div>
        )
      ) : (
        <div>
          <div className="flex align-items-center gap-2 mb-3">
            <Button
              icon="pi pi-arrow-left"
              text
              size="small"
              onClick={() => setViewMode("list")}
            />
            <span className="font-bold text-lg">
              {viewMode === "create"
                ? "Crear Nuevo Rol"
                : `Editar: ${editingRole?.name}`}
            </span>
          </div>
          <Divider className="mt-0 mb-3" />
          {renderPermissionsEditor()}
        </div>
      )}
    </Dialog>
  );
};

export default EmpresaRoles;
