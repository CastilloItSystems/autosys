"use client";
import React, { useEffect, useRef, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { ProgressSpinner } from "primereact/progressspinner";

import UsuarioForm from "./UsuarioForm";
import UsuarioChangePasswordForm from "./UsuarioChangePasswordForm";
import UsuarioPermisos from "./UsuarioPermisos";
import CustomActionButtons from "../common/CustomActionButtons";
import AuditHistoryDialog from "../common/AuditHistoryDialog";
import { Usuario } from "@/libs/interfaces";
import {
  deleteUser,
  getUsers,
  getAuditLogsForUser,
} from "@/app/api/userService";

const UsuarioList = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  // Dialog states
  const [deleteUsuarioDialog, setDeleteUsuarioDialog] = useState(false);
  const [usuarioFormDialog, setUsuarioFormDialog] = useState(false);
  const [usuarioPasswordFormDialog, setUsuarioPasswordFormDialog] =
    useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);

  const [selectedAuditUsuario, setSelectedAuditUsuario] =
    useState<Usuario | null>(null);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  // Estado para el panel de permisos
  const [permisosDialogVisible, setPermisosDialogVisible] = useState(false);
  const [selectedPermisosUsuario, setSelectedPermisosUsuario] =
    useState<Usuario | null>(null);

  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  const initFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue("");
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usuariosDB = await getUsers();
      setUsuarios(usuariosDB.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar usuarios",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    initFilters();
  }, []);

  const openNew = () => {
    setUsuario(null);
    setUsuarioFormDialog(true);
  };

  const hideUsuarioFormDialog = () => {
    setUsuarioFormDialog(false);
    setUsuario(null);
  };

  const hideUsuarioPasswordFormDialog = () => {
    setUsuarioPasswordFormDialog(false);
    setUsuario(null);
  };

  const hideDeleteUsuarioDialog = () => {
    setDeleteUsuarioDialog(false);
    setUsuario(null);
  };

  const handleSave = () => {
    fetchUsers();
    hideUsuarioFormDialog();
  };

  const handlePasswordChanged = () => {
    fetchUsers();
    hideUsuarioPasswordFormDialog();
  };

  const editUsuario = (usuario: Usuario) => {
    setUsuario({ ...usuario });
    setUsuarioFormDialog(true);
  };

  const changePassword = (usuario: Usuario) => {
    setUsuario({ ...usuario });
    setUsuarioPasswordFormDialog(true);
  };

  const confirmDeleteUsuario = (usuario: Usuario) => {
    setUsuario(usuario);
    setDeleteUsuarioDialog(true);
  };

  const deleteUsuarioAction = async () => {
    if (usuario?.id) {
      try {
        await deleteUser(usuario.id);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Usuario Eliminado",
          life: 3000,
        });
        fetchUsers();
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el usuario",
          life: 3000,
        });
      } finally {
        setDeleteUsuarioDialog(false);
        setUsuario(null);
      }
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let _filters = { ...filters };
    (_filters["global"] as any).value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const showToast = (
    severity: "success" | "error",
    summary: string,
    detail: string,
  ) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Gestión de Usuarios</h4>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
          />
        </span>
        <Button label="Nuevo Usuario" icon="pi pi-plus" onClick={openNew} />
      </div>
    </div>
  );

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div className="flex align-items-center gap-2">
        <CustomActionButtons
          rowData={rowData}
          onInfo={async (data) => {
            setSelectedAuditUsuario(data);
            setAuditLogsLoading(true);
            try {
              const result = await getAuditLogsForUser(data.id);
              setAuditLogs(result.auditLogs || []);
            } catch (error) {
              console.error("Error loading audit logs:", error);
              toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Error al cargar el historial de auditoría",
                life: 3000,
              });
              setAuditLogs([]);
            } finally {
              setAuditLogsLoading(false);
            }
            setAuditDialogVisible(true);
          }}
          onEdit={() => editUsuario(rowData)}
          onDelete={() => confirmDeleteUsuario(rowData)}
        />
        <Button
          icon="pi pi-key"
          className="p-button-rounded p-button-text p-button-secondary"
          onClick={() => changePassword(rowData)}
          tooltip="Cambiar Contraseña"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-shield"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => {
            setSelectedPermisosUsuario(rowData);
            setPermisosDialogVisible(true);
          }}
          tooltip="Gestionar Permisos"
          tooltipOptions={{ position: "top" }}
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
        onClick={deleteUsuarioAction}
      />
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />

      <div className="card">
        <DataTable
          ref={dt}
          value={usuarios}
          header={header}
          paginator
          rows={10}
          scrollable
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          globalFilterFields={["nombre", "correo", "rol", "telefono"]}
          loading={loading}
          emptyMessage="No se encontraron usuarios."
          size="small"
        >
          <Column
            body={actionBodyTemplate}
            style={{ minWidth: "180px" }}
          ></Column>
          <Column
            field="nombre"
            header="Nombre"
            sortable
            style={{ minWidth: "200px" }}
          ></Column>
          <Column
            field="correo"
            header="Correo"
            sortable
            style={{ minWidth: "250px" }}
          ></Column>
          <Column
            field="telefono"
            header="Teléfono"
            sortable
            style={{ minWidth: "150px" }}
          ></Column>
          <Column
            header="Empresa / Rol"
            body={(rowData) => {
              if (rowData.userEmpresaRoles?.length > 0) {
                return (
                  <div className="flex flex-column gap-1">
                    {rowData.userEmpresaRoles.map((uer: any) => (
                      <div key={uer.empresaId} className="flex align-items-center gap-2">
                        <span className="text-500 text-xs">{uer.empresa?.nombre}</span>
                        <Tag value={uer.role?.name} severity="info" />
                      </div>
                    ))}
                  </div>
                );
              }
              return <Tag value={rowData.rol || "Sin rol"} severity="secondary" />;
            }}
            style={{ minWidth: "220px" }}
          ></Column>
          <Column
            field="acceso"
            header="Acceso"
            sortable
            body={(rowData) => {
              const severity =
                rowData.acceso === "completo" ? "success" :
                rowData.acceso === "limitado" ? "warning" : "secondary";
              return <Tag value={rowData.acceso} severity={severity} />;
            }}
            style={{ minWidth: "110px" }}
          ></Column>
          <Column
            field="estado"
            header="Estado"
            sortable
            body={(rowData) => {
              const getSeverity = (status: string) => {
                switch (status) {
                  case "activo":
                    return "success";
                  case "pendiente":
                    return "warning";
                  case "suspendido":
                    return "danger";
                  default:
                    return "info";
                }
              };
              return (
                <Tag
                  value={rowData.estado}
                  severity={getSeverity(rowData.estado)}
                />
              );
            }}
            style={{ minWidth: "100px", textAlign: "center" }}
          ></Column>
        </DataTable>
      </div>

      <AuditHistoryDialog
        visible={auditDialogVisible}
        onHide={() => setAuditDialogVisible(false)}
        title={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-user mr-3 text-primary text-3xl"></i>
                Historial de Auditoría - {selectedAuditUsuario?.nombre}
              </h2>
            </div>
          </div>
        }
        auditLogs={auditLogs}
        loading={auditLogsLoading}
      />

      <Dialog
        visible={usuarioFormDialog}
        style={{ width: "850px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-user-edit mr-3 text-primary text-3xl"></i>
                {usuario ? "Editar Usuario" : "Crear Usuario"}
              </h2>
            </div>
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

      {/* ── Panel de gestión de permisos ── */}
      {selectedPermisosUsuario && (
        <UsuarioPermisos
          visible={permisosDialogVisible}
          onHide={() => {
            setPermisosDialogVisible(false);
            setSelectedPermisosUsuario(null);
          }}
          userId={selectedPermisosUsuario.id}
          userName={selectedPermisosUsuario.nombre}
          toast={toast}
        />
      )}
    </motion.div>
  );
};

export default UsuarioList;
