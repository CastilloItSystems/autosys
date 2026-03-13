"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";

import FormActionButtons from "../common/FormActionButtons";
import MembershipForm from "./MembershipForm";
import MembershipPermissions from "./MembershipPermissions";
import {
  deleteMembership,
  getMembershipsByUser,
  Membership,
} from "@/app/api/userService";
import CreateButton from "../common/CreateButton";

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
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
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
    setIsSubmittingForm(false);
    await load();
  };

  const hideFormDialog = () => {
    setFormDialogVisible(false);
    setSelectedMembership(null);
    setIsSubmittingForm(false);
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
    <div className="flex w-full gap-2 mb-4">
      <Button
        label="No"
        icon="pi pi-times"
        severity="secondary"
        onClick={() => setDeleteDialogVisible(false)}
        className="flex-1"
      />
      <Button
        label="Sí, eliminar"
        icon="pi pi-trash"
        severity="danger"
        onClick={handleDelete}
        className="flex-1"
      />
    </div>
  );

  const tableHeader = (
    <div className="flex justify-content-between align-items-center">
      <span className="text-lg font-semibold">Memberships de {userName}</span>
      <CreateButton
        label="Crear Membership"
        onClick={handleNew}
        tooltip="Agregar Nueva Membership"
      />
    </div>
  );

  const formFooter = (
    <FormActionButtons
      onCancel={hideFormDialog}
      isSubmitting={isSubmittingForm}
      isUpdate={!!selectedMembership}
      formId="membership-form"
    />
  );

  return (
    <>
      <Dialog
        visible={visible}
        style={{ width: "820px" }}
        header={
          <div className="flex align-items-center gap-2 border-bottom-2 border-primary pb-2">
            <i className="pi pi-sitemap text-primary text-3xl" />
            <span className="text-2xl font-bold text-900">Memberships</span>
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
        header={
          <div className="flex align-items-center gap-2 border-bottom-2 border-primary pb-2">
            <i className="pi pi-sitemap text-primary text-3xl" />
            <span className="text-2xl font-bold text-900">
              {selectedMembership ? "Editar Membership" : "Nueva Membership"}
            </span>
          </div>
        }
        modal
        footer={formFooter}
        onHide={hideFormDialog}
      >
        <MembershipForm
          userId={userId}
          membership={selectedMembership}
          onSave={handleFormSave}
          onCancel={hideFormDialog}
          toast={toast}
          onSubmittingChange={setIsSubmittingForm}
        />
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog
        visible={deleteDialogVisible}
        style={{ width: "450px" }}
        header={
          <div className="flex align-items-center gap-2 border-bottom-2 border-primary pb-2">
            <i className="pi pi-trash text-primary text-3xl" />
            <span className="text-2xl font-bold text-900">
              Confirmar eliminación
            </span>
          </div>
        }
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
