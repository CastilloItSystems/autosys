"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "primereact/button";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";

import UsuarioForm from "./UsuarioForm";
import UsuarioChangePasswordForm from "./UsuarioChangePasswordForm";
import UsuarioMemberships from "./UsuarioMemberships";

import {
  deleteUser,
  getUsers,
  getAuditLogsForUser,
  User,
  AuditLog,
} from "@/app/api/userService";

const UsuarioList = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [usuario, setUsuario] = useState<User | null>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [deleteUsuarioDialog, setDeleteUsuarioDialog] = useState(false);
  const [usuarioFormDialog, setUsuarioFormDialog] = useState(false);
  const [usuarioPasswordFormDialog, setUsuarioPasswordFormDialog] =
    useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);

  const [membershipDialogVisible, setMembershipDialogVisible] = useState(false);
  const [selectedMembershipUser, setSelectedMembershipUser] =
    useState<User | null>(null);

  const [selectedAuditUsuario, setSelectedAuditUsuario] = useState<User | null>(
    null,
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  const toast = useRef<Toast | null>(null);

  const showToast = (
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
  };

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setUsuarios(response.users ?? []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      showToast("error", "Error", "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const openNew = () => {
    setUsuario(null);
    setUsuarioFormDialog(true);
  };

  const hideUsuarioFormDialog = () => {
    setUsuarioFormDialog(false);
  };

  const hideUsuarioPasswordFormDialog = () => {
    setUsuarioPasswordFormDialog(false);
  };

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
    await loadUsuarios();
    setUsuarioFormDialog(false);
    setUsuario(null);
  };

  const handlePasswordChanged = async () => {
    await loadUsuarios();
    setUsuarioPasswordFormDialog(false);
    setUsuario(null);
  };

  const handleDeleteUsuario = async () => {
    if (!usuario) return;

    try {
      await deleteUser(usuario.id);
      showToast("success", "Éxito", "Usuario eliminado correctamente");
      await loadUsuarios();
      setDeleteUsuarioDialog(false);
      setUsuario(null);
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      showToast("error", "Error", "No se pudo eliminar el usuario");
    }
  };

  const handleManageMemberships = (usuario: User) => {
    setSelectedMembershipUser(usuario);
    setMembershipDialogVisible(true);
  };

  const handleViewAudit = async (usuario: User) => {
    try {
      setSelectedAuditUsuario(usuario);
      setAuditDialogVisible(true);
      setAuditLogsLoading(true);

      const response = await getAuditLogsForUser(usuario.id);
      setAuditLogs(response.auditLogs ?? []);
    } catch (error) {
      console.error("Error cargando auditoría:", error);
      showToast("error", "Error", "No se pudo cargar la auditoría");
    } finally {
      setAuditLogsLoading(false);
    }
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
      return <span className="text-500">Sin empresas</span>;
    }

    return (
      <div className="flex flex-column gap-1">
        {memberships.map((membership) => (
          <div key={membership.id} className="text-sm">
            <strong>
              {membership.empresa?.nombre ?? membership.empresaId}
            </strong>
            {membership.role?.name ? ` — ${membership.role.name}` : ""}
          </div>
        ))}
      </div>
    );
  };

  const actionBodyTemplate = (rowData: User) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          severity="success"
          tooltip="Editar"
          onClick={() => editUsuario(rowData)}
        />
        <Button
          icon="pi pi-key"
          rounded
          outlined
          severity="help"
          tooltip="Cambiar contraseña"
          onClick={() => confirmChangePassword(rowData)}
        />
        <Button
          icon="pi pi-sitemap"
          rounded
          outlined
          severity="secondary"
          tooltip="Memberships"
          onClick={() => handleManageMemberships(rowData)}
        />
        <Button
          icon="pi pi-history"
          rounded
          outlined
          severity="info"
          tooltip="Ver auditoría"
          onClick={() => handleViewAudit(rowData)}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          tooltip="Eliminar"
          onClick={() => confirmDeleteUsuario(rowData)}
        />
      </div>
    );
  };

  const deleteUsuarioDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={hideDeleteUsuarioDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        severity="danger"
        onClick={handleDeleteUsuario}
      />
    </>
  );

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <h4 className="m-0">Usuarios</h4>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
          />
        </span>
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          severity="success"
          onClick={openNew}
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
          filters={filters}
          globalFilter={globalFilterValue}
          header={header}
          emptyMessage="No se encontraron usuarios"
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
          <Column header="Empresas" body={empresasBodyTemplate} />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "14rem" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={usuarioFormDialog}
        style={{ width: "850px" }}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-user" />
            <h2 className="m-0 text-xl">
              {usuario ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideUsuarioFormDialog}
      >
        <UsuarioForm
          usuario={usuario}
          onSave={handleSave}
          onCancel={hideUsuarioFormDialog}
          toast={toast}
        />
      </Dialog>

      <Dialog
        visible={usuarioPasswordFormDialog}
        style={{ width: "600px" }}
        header="Cambiar Contraseña"
        modal
        onHide={hideUsuarioPasswordFormDialog}
      >
        <UsuarioChangePasswordForm
          usuario={usuario}
          hideUsuarioPasswordFormDialog={hideUsuarioPasswordFormDialog}
          onPasswordChanged={handlePasswordChanged}
          showToast={showToast}
        />
      </Dialog>

      <Dialog
        visible={deleteUsuarioDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteUsuarioDialogFooter}
        onHide={hideDeleteUsuarioDialog}
      >
        <div className="flex align-items-center justify-content-center">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {usuario && (
            <span>
              ¿Estás seguro de que deseas eliminar a <b>{usuario.nombre}</b>?
            </span>
          )}
        </div>
      </Dialog>

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
          setAuditLogs([]);
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
    </motion.div>
  );
};

export default UsuarioList;
