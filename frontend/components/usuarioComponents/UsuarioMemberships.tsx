"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";

import MembershipForm from "./MembershipForm";
import MembershipPermissions from "./MembershipPermissions";
import {
  deleteMembership,
  getMembershipsByUser,
  Membership,
} from "@/app/api/userService";

const statusSeverity: Record<
  string,
  "success" | "warning" | "danger" | "info"
> = {
  active: "success",
  invited: "warning",
  suspended: "danger",
};

const statusLabel: Record<string, string> = {
  active: "Activo",
  invited: "Invitado",
  suspended: "Suspendido",
};

interface UsuarioMembershipsProps {
  visible: boolean;
  onHide: () => void;
  userId: string;
  userName: string;
  toast: React.RefObject<Toast | null>;
}

const UsuarioMemberships = ({
  visible,
  onHide,
  userId,
  userName,
  toast,
}: UsuarioMembershipsProps) => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);

  const [formDialogVisible, setFormDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [permDialogVisible, setPermDialogVisible] = useState(false);
  const [selectedMembership, setSelectedMembership] =
    useState<Membership | null>(null);
  const [selectedPermMembership, setSelectedPermMembership] =
    useState<Membership | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await getMembershipsByUser(userId);
      setMemberships(res.memberships ?? []);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las memberships",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const handleNew = () => {
    setSelectedMembership(null);
    setFormDialogVisible(true);
  };

  const handleEdit = (m: Membership) => {
    setSelectedMembership(m);
    setFormDialogVisible(true);
  };

  const handleConfirmDelete = (m: Membership) => {
    setSelectedMembership(m);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedMembership) return;
    try {
      await deleteMembership(selectedMembership.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Membership eliminada correctamente",
        life: 3000,
      });
      setDeleteDialogVisible(false);
      setSelectedMembership(null);
      await load();
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la membership",
        life: 3000,
      });
    }
  };

  const handleFormSave = async () => {
    setFormDialogVisible(false);
    setSelectedMembership(null);
    await load();
  };

  // ── Column templates ──────────────────────────────────────────────────────

  const statusTemplate = (rowData: Membership) => (
    <Tag
      value={statusLabel[rowData.status] ?? rowData.status}
      severity={statusSeverity[rowData.status] ?? "info"}
    />
  );

  const handleManagePermissions = (m: Membership) => {
    setSelectedPermMembership(m);
    setPermDialogVisible(true);
  };

  const actionsTemplate = (rowData: Membership) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-lock"
        rounded
        outlined
        severity="info"
        tooltip="Permisos individuales"
        onClick={() => handleManagePermissions(rowData)}
      />
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="success"
        tooltip="Editar"
        onClick={() => handleEdit(rowData)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        tooltip="Eliminar"
        onClick={() => handleConfirmDelete(rowData)}
      />
    </div>
  );

  // ── Dialog footers ────────────────────────────────────────────────────────

  const deleteFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={() => setDeleteDialogVisible(false)}
      />
      <Button
        label="Sí, eliminar"
        icon="pi pi-trash"
        severity="danger"
        onClick={handleDelete}
      />
    </>
  );

  const tableHeader = (
    <div className="flex justify-content-between align-items-center">
      <span className="text-lg font-semibold">Memberships de {userName}</span>
      <Button
        label="Agregar"
        icon="pi pi-plus"
        severity="success"
        size="small"
        onClick={handleNew}
      />
    </div>
  );

  return (
    <>
      <Dialog
        visible={visible}
        style={{ width: "820px" }}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-sitemap" />
            <span className="text-xl font-semibold">Memberships</span>
          </div>
        }
        modal
        onHide={onHide}
      >
        <DataTable
          value={memberships}
          loading={loading}
          header={tableHeader}
          emptyMessage="Este usuario no tiene memberships"
          responsiveLayout="scroll"
        >
          <Column
            header="Empresa"
            body={(m: Membership) => m.empresa?.nombre ?? m.empresaId}
          />
          <Column
            header="Rol"
            body={(m: Membership) => m.role?.name ?? m.roleId}
          />
          <Column header="Estado" body={statusTemplate} />
          <Column
            header="Asignado"
            body={(m: Membership) =>
              new Date(m.assignedAt).toLocaleDateString()
            }
          />
          <Column body={actionsTemplate} style={{ minWidth: "8rem" }} />
        </DataTable>
      </Dialog>

      {/* Formulario crear / editar */}
      <Dialog
        visible={formDialogVisible}
        style={{ width: "560px" }}
        header={selectedMembership ? "Editar Membership" : "Nueva Membership"}
        modal
        onHide={() => {
          setFormDialogVisible(false);
          setSelectedMembership(null);
        }}
      >
        <MembershipForm
          userId={userId}
          membership={selectedMembership}
          onSave={handleFormSave}
          onCancel={() => {
            setFormDialogVisible(false);
            setSelectedMembership(null);
          }}
          toast={toast}
        />
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog
        visible={deleteDialogVisible}
        style={{ width: "450px" }}
        header="Confirmar eliminación"
        modal
        footer={deleteFooter}
        onHide={() => setDeleteDialogVisible(false)}
      >
        <div className="flex align-items-center gap-3">
          <i
            className="pi pi-exclamation-triangle text-yellow-500"
            style={{ fontSize: "2rem" }}
          />
          {selectedMembership && (
            <span>
              ¿Eliminar la membership de{" "}
              <b>
                {selectedMembership.empresa?.nombre ??
                  selectedMembership.empresaId}
              </b>
              ?
            </span>
          )}
        </div>
      </Dialog>

      {/* Permisos individuales por membership */}
      {selectedPermMembership && (
        <MembershipPermissions
          visible={permDialogVisible}
          onHide={() => {
            setPermDialogVisible(false);
            setSelectedPermMembership(null);
          }}
          membershipId={selectedPermMembership.id}
          membershipLabel={`${userName} — ${
            selectedPermMembership.empresa?.nombre ??
            selectedPermMembership.empresaId
          }`}
          toast={toast}
        />
      )}
    </>
  );
};

export default UsuarioMemberships;
