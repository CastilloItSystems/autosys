"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";

import UsuarioForm from "./UsuarioForm";
import UsuarioChangePasswordForm from "./UsuarioChangePasswordForm";
import UsuarioMemberships from "./UsuarioMemberships";
import FormActionButtons from "@/shared/components/FormActionButtons";
import CreateButton from "../../../components/common/CreateButton";
import DeleteConfirmDialog from "../../../components/common/DeleteConfirmDialog";

import {
  deleteCompanyUser,
  deleteUser,
} from "@/modules/users/services/user.service";
import type { User, UserScope } from "../interfaces/user.interface";
import { useUserAuditLogsData, useUsersData } from "../hooks/useUsersData";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useRefreshAuthContext } from "@/hooks/useRefreshAuthContext";

interface UsuarioListContentProps {
  scope?: UserScope;
}

const UsuarioListContent = ({ scope = "global" }: UsuarioListContentProps) => {
  const isCompanyScope = scope === "company";
  const {
    hasPermission,
    hasAnyPermission,
    hasPermissionInAnyEmpresa,
  } = useUserPermissions();
  const refreshAuthContext = useRefreshAuthContext();
  const canEdit = isCompanyScope
    ? hasPermission("users.update")
    : hasPermissionInAnyEmpresa("platform_users.update");
  const canDelete = isCompanyScope
    ? hasPermission("users.delete")
    : hasPermissionInAnyEmpresa("platform_users.delete");
  const canManageMemberships = isCompanyScope
    ? hasAnyPermission(["users.view", "users.update"])
    : false;
  const canViewAudit = isCompanyScope && hasPermission("audit.view");
  const createPermission = isCompanyScope
    ? "users.create"
    : "platform_users.create";

  const [usuario, setUsuario] = useState<User | null>(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteUsuarioDialog, setDeleteUsuarioDialog] = useState(false);
  const [usuarioFormDialog, setUsuarioFormDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [usuarioPasswordFormDialog, setUsuarioPasswordFormDialog] =
    useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);

  const [membershipDialogVisible, setMembershipDialogVisible] = useState(false);
  const [selectedMembershipUser, setSelectedMembershipUser] =
    useState<User | null>(null);

  const [actionUser, setActionUser] = useState<User | null>(null);
  const menuRef = useRef<Menu>(null);

  const [selectedAuditUsuario, setSelectedAuditUsuario] = useState<User | null>(
    null,
  );

  const toast = useRef<Toast | null>(null);
  const {
    usuarios,
    loading,
    error: usersError,
    mutate: mutateUsuarios,
  } = useUsersData(scope);
  const {
    auditLogs,
    loading: auditLogsLoading,
    error: auditLogsError,
  } = useUserAuditLogsData(
    auditDialogVisible ? selectedAuditUsuario?.id : null,
  );

  const showToast = useCallback((
    severity: "success" | "info" | "warn" | "error",
    summary: string,
    detail: string,
  ) => {
    toast.current?.show({
      severity,
      summary,
      detail,
      life: 3000,
    });
  }, []);

  useEffect(() => {
    if (usersError) {
      showToast("error", "Error", "No se pudieron cargar los usuarios");
    }
  }, [showToast, usersError]);

  useEffect(() => {
    if (auditLogsError) {
      showToast("error", "Error", "No se pudo cargar la auditoría");
    }
  }, [auditLogsError, showToast]);

  const openNew = () => {
    setUsuario(null);
    setUsuarioFormDialog(true);
  };

  const hideUsuarioFormDialog = () => {
    setUsuarioFormDialog(false);
    setIsSubmitting(false);
  };

  const usuarioFormFooter = (
    <FormActionButtons
      onCancel={hideUsuarioFormDialog}
      isUpdate={!!usuario}
      formId="usuario-form"
      isSubmitting={isSubmitting}
    />
  );

  const hideUsuarioPasswordFormDialog = () => {
    setUsuarioPasswordFormDialog(false);
    setIsPasswordSubmitting(false);
  };

  const passwordFormFooter = (
    <FormActionButtons
      onCancel={hideUsuarioPasswordFormDialog}
      isUpdate={true}
      submitLabel="Cambiar Contraseña"
      formId="password-form"
      isSubmitting={isPasswordSubmitting}
    />
  );

  const hideDeleteUsuarioDialog = () => {
    setDeleteUsuarioDialog(false);
  };

  const editUsuario = (usuario: User) => {
    setUsuario(usuario);
    setUsuarioFormDialog(true);
  };

  const confirmDeleteUsuario = (usuario: User) => {
    setUsuario(usuario);
    setDeleteUsuarioDialog(true);
  };

  const confirmChangePassword = (usuario: User) => {
    setUsuario(usuario);
    setUsuarioPasswordFormDialog(true);
  };

  const handleSave = async () => {
    await mutateUsuarios();
    setUsuarioFormDialog(false);
    setUsuario(null);
  };

  const handlePasswordChanged = async () => {
    await mutateUsuarios();
    setUsuarioPasswordFormDialog(false);
    setUsuario(null);
  };

  const handleDeleteUsuario = async () => {
    if (!usuario) return;

    setIsDeleting(true);
    try {
      if (isCompanyScope) {
        await deleteCompanyUser(usuario.id);
      } else {
        await deleteUser(usuario.id);
      }
      showToast(
        "success",
        "Éxito",
        isCompanyScope
          ? "Usuario removido de la empresa correctamente"
          : "Usuario eliminado correctamente",
      );
      await refreshAuthContext();
      await mutateUsuarios();
      setDeleteUsuarioDialog(false);
      setUsuario(null);
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      showToast("error", "Error", "No se pudo eliminar el usuario");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleManageMemberships = (usuario: User) => {
    setSelectedMembershipUser(usuario);
    setMembershipDialogVisible(true);
  };

  const handleViewAudit = (usuario: User) => {
    setSelectedAuditUsuario(usuario);
    setAuditDialogVisible(true);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
  };

  const estadoBodyTemplate = (rowData: User) => {
    const severityMap: Record<
      string,
      "success" | "warning" | "danger" | "info"
    > = {
      activo: "success",
      pendiente: "warning",
      suspendido: "danger",
    };

    return (
      <Tag
        value={rowData.estado}
        severity={severityMap[rowData.estado] || "info"}
      />
    );
  };

  const accesoBodyTemplate = (rowData: User) => {
    const severityMap: Record<string, "success" | "warning" | "secondary"> = {
      completo: "success",
      limitado: "warning",
      ninguno: "secondary",
    };

    return (
      <Tag
        value={rowData.acceso}
        severity={severityMap[rowData.acceso] || "secondary"}
      />
    );
  };

  const empresasBodyTemplate = (rowData: User) => {
    const memberships = rowData.memberships ?? [];

    if (memberships.length === 0) {
      return (
        <span className="text-500">
          {isCompanyScope ? "Sin rol" : "Sin empresas"}
        </span>
      );
    }

    return (
      <div className="flex flex-column gap-1">
        {memberships.map((membership) => (
          <div key={membership.id} className="text-sm">
            <strong>
              {isCompanyScope
                ? membership.role?.name ?? membership.roleId
                : membership.empresa?.nombre ?? membership.empresaId}
            </strong>
            {isCompanyScope
              ? ` — ${membership.status}`
              : membership.role?.name
                ? ` — ${membership.role.name}`
                : ""}
          </div>
        ))}
      </div>
    );
  };

  const getMenuItems = (user: User | null): MenuItem[] => {
    if (!user) return [];
    const items: MenuItem[] = [];

    if (canEdit) {
      items.push({
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => editUsuario(user),
      });
      items.push({
        label: "Cambiar contraseña",
        icon: "pi pi-key",
        command: () => confirmChangePassword(user),
      });
    }

    if (canManageMemberships) {
      items.push({
        label: "Memberships",
        icon: "pi pi-sitemap",
        command: () => handleManageMemberships(user),
      });
    }

    if (canViewAudit) {
      items.push({
        label: "Ver auditoría",
        icon: "pi pi-history",
        command: () => handleViewAudit(user),
      });
    }

    if (canDelete) {
      if (items.length > 0) {
        items.push({ separator: true });
      }

      items.push({
        label: isCompanyScope ? "Quitar de empresa" : "Eliminar",
        icon: "pi pi-trash",
        className: "p-error",
        command: () => confirmDeleteUsuario(user),
      });
    }

    return items;
  };

  const actionBodyTemplate = (rowData: User) => {
    if (getMenuItems(rowData).length === 0) return null;

    return (
      <div className="flex justify-content-center">
        <Button
          icon="pi pi-cog"
          tooltip="Opciones"
          tooltipOptions={{ position: "left" }}
          rounded
          text
          severity="secondary"
          onClick={(e) => {
            setActionUser(rowData);
            menuRef.current?.toggle(e);
          }}
          aria-controls="popup_menu"
          aria-haspopup
        />
      </div>
    );
  };

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <h4 className="m-0">
        {isCompanyScope ? "Usuarios y Permisos" : "Usuarios Plataforma"}
      </h4>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
          />
        </span>
        <CreateButton
          label="Nuevo Usuario"
          onClick={openNew}
          tooltip="Agregar Nuevo Usuario"
          permission={createPermission}
          permissionScope={isCompanyScope ? "active" : "any"}
        />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Toast ref={toast} />

      <div className="card">
        <DataTable
          value={usuarios}
          paginator
          rows={10}
          dataKey="id"
          loading={loading}
          globalFilter={globalFilterValue}
          header={header}
          emptyMessage="No se encontraron usuarios"
          scrollable
          responsiveLayout="scroll"
        >
          <Column field="nombre" header="Nombre" sortable />
          <Column field="correo" header="Correo" sortable />
          <Column field="telefono" header="Teléfono" />
          <Column
            field="departamento"
            header="Departamento"
            body={(rowData: User) => rowData.departamento?.join(", ")}
          />
          <Column field="acceso" header="Acceso" body={accesoBodyTemplate} />
          <Column field="estado" header="Estado" body={estadoBodyTemplate} />
          <Column
            header={isCompanyScope ? "Rol en empresa" : "Empresas"}
            body={empresasBodyTemplate}
          />
          <Column
            header="Acciones"
            body={actionBodyTemplate}
            exportable={false}
            alignFrozen="right"
            frozen
            style={{ width: "6rem" }}
            bodyStyle={{ textAlign: "center" }}
            headerStyle={{ textAlign: "center", justifyContent: "center" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={usuarioFormDialog}
        style={{ width: "850px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-user mr-3 text-primary text-3xl"></i>
                {usuario ? "Modificar Usuario" : "Crear Usuario"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        footer={usuarioFormFooter}
        onHide={hideUsuarioFormDialog}
      >
        <UsuarioForm
          usuario={usuario}
          onSave={handleSave}
          toast={toast}
          formId="usuario-form"
          onSubmittingChange={setIsSubmitting}
          scope={scope}
        />
      </Dialog>

      <Dialog
        visible={usuarioPasswordFormDialog}
        style={{ width: "600px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-key mr-3 text-primary text-3xl"></i>
                Cambiar Contraseña
              </h2>
            </div>
          </div>
        }
        modal
        footer={passwordFormFooter}
        onHide={hideUsuarioPasswordFormDialog}
      >
        <UsuarioChangePasswordForm
          usuario={usuario}
          hideUsuarioPasswordFormDialog={hideUsuarioPasswordFormDialog}
          onPasswordChanged={handlePasswordChanged}
          toast={toast}
          formId="password-form"
          onSubmittingChange={setIsPasswordSubmitting}
          scope={scope}
        />
      </Dialog>

      <DeleteConfirmDialog
        visible={deleteUsuarioDialog}
        onHide={hideDeleteUsuarioDialog}
        onConfirm={handleDeleteUsuario}
        itemName={usuario?.nombre}
        isDeleting={isDeleting}
      />

      <Dialog
        visible={auditDialogVisible}
        style={{ width: "900px" }}
        header={`Auditoría${
          selectedAuditUsuario ? ` - ${selectedAuditUsuario.nombre}` : ""
        }`}
        modal
        onHide={() => {
          setAuditDialogVisible(false);
          setSelectedAuditUsuario(null);
        }}
      >
        {auditLogsLoading ? (
          <div className="text-center p-4">Cargando auditoría...</div>
        ) : (
          <div className="flex flex-column gap-3">
            {auditLogs.length === 0 ? (
              <div className="text-center text-500 p-4">
                No hay registros de auditoría
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="border-1 surface-border border-round p-3"
                >
                  <div className="flex justify-content-between align-items-center mb-2">
                    <div className="font-semibold">
                      {log.action} - {log.entity}
                    </div>
                    <small className="text-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </small>
                  </div>

                  {log.user && (
                    <div className="mb-2 text-sm">
                      <strong>Usuario:</strong> {log.user.nombre} (
                      {log.user.correo})
                    </div>
                  )}

                  <pre
                    className="text-sm p-2 border-round surface-100 overflow-auto"
                    style={{ maxHeight: "250px" }}
                  >
                    {JSON.stringify(log.changes, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}
      </Dialog>

      {/* Memberships por usuario */}
      {selectedMembershipUser && (
        <UsuarioMemberships
          visible={membershipDialogVisible}
          onHide={() => {
            setMembershipDialogVisible(false);
            setSelectedMembershipUser(null);
          }}
          userId={selectedMembershipUser.id}
          userName={selectedMembershipUser.nombre}
          toast={toast}
        />
      )}

      <Menu
        model={getMenuItems(actionUser)}
        popup
        ref={menuRef}
        id="popup_menu"
      />
    </motion.div>
  );
};

export default UsuarioListContent;
