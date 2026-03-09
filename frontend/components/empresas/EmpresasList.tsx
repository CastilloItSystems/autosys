"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { motion } from "framer-motion";
import { ProgressSpinner } from "primereact/progressspinner";

import EmpresaForm from "./EmpresaForm";
import EmpresaRoles from "./EmpresaRoles";
import CustomActionButtons from "../common/CustomActionButtons";
import AuditHistoryDialog from "../common/AuditHistoryDialog";
import { Empresa } from "@/libs/interfaces/empresaInterface";
import {
  deleteEmpresa,
  getEmpresas,
  getAuditLogsForEmpresa,
} from "@/app/api/empresaService";

const EmpresasList = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  // Dialog states
  const [deleteEmpresaDialog, setDeleteEmpresaDialog] = useState(false);
  const [empresaFormDialog, setEmpresaFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);

  const [selectedAuditEmpresa, setSelectedAuditEmpresa] =
    useState<Empresa | null>(null);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  // Estado para el panel de roles dinámicos
  const [rolesDialogVisible, setRolesDialogVisible] = useState(false);
  const [selectedRolesEmpresa, setSelectedRolesEmpresa] = useState<Empresa | null>(null);

  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  const initFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue("");
  };

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const empresasDB = await getEmpresas();
      // Ajuste según la respuesta de tu backend
      setEmpresas(empresasDB.empresas || empresasDB || []);
    } catch (error) {
      console.error("Error cargando empresas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar empresas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
    initFilters();
  }, []);

  const openNew = () => {
    setEmpresa(null);
    setEmpresaFormDialog(true);
  };

  const hideEmpresaFormDialog = () => {
    setEmpresaFormDialog(false);
    setEmpresa(null);
  };

  const hideDeleteEmpresaDialog = () => {
    setDeleteEmpresaDialog(false);
    setEmpresa(null);
  };

  const handleSave = () => {
    fetchEmpresas();
    hideEmpresaFormDialog();
  };

  const editEmpresa = (empresa: Empresa) => {
    setEmpresa({ ...empresa });
    setEmpresaFormDialog(true);
  };

  const confirmDeleteEmpresa = (empresa: Empresa) => {
    setEmpresa(empresa);
    setDeleteEmpresaDialog(true);
  };

  const deleteEmpresaAction = async () => {
    if (empresa?.id_empresa) {
      try {
        await deleteEmpresa(empresa.id_empresa);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Empresa Eliminada",
          life: 3000,
        });
        fetchEmpresas();
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar la empresa",
          life: 3000,
        });
      } finally {
        setDeleteEmpresaDialog(false);
        setEmpresa(null);
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

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Gestión de Empresas</h4>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
          />
        </span>
        <Button label="Nueva Empresa" icon="pi pi-plus" onClick={openNew} />
      </div>
    </div>
  );

  const actionBodyTemplate = (rowData: Empresa) => {
    return (
      <div className="flex align-items-center gap-1">
        <CustomActionButtons
          rowData={rowData}
          onInfo={async (data) => {
          setSelectedAuditEmpresa(data);
          setAuditLogsLoading(true);
          try {
            const result = await getAuditLogsForEmpresa(data.id_empresa);
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
          onEdit={() => editEmpresa(rowData)}
          onDelete={() => confirmDeleteEmpresa(rowData)}
        />
        <Button
          icon="pi pi-shield"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => {
            setSelectedRolesEmpresa(rowData);
            setRolesDialogVisible(true);
          }}
          tooltip="Gestionar Roles"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const deleteEmpresaDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={hideDeleteEmpresaDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteEmpresaAction}
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
          value={empresas}
          header={header}
          paginator
          rows={10}
          scrollable
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          globalFilterFields={["nombre", "numerorif", "direccion", "email"]}
          loading={loading}
          emptyMessage="No se encontraron empresas."
          size="small"
        >
          <Column
            field="nombre"
            header="Nombre"
            sortable
            style={{ minWidth: "200px" }}
          ></Column>
          <Column
            field="numerorif"
            header="RIF"
            sortable
            style={{ minWidth: "120px" }}
          ></Column>
          <Column
            field="direccion"
            header="Dirección"
            sortable
            style={{ minWidth: "250px" }}
          ></Column>
          <Column
            field="telefonos"
            header="Teléfonos"
            sortable
            style={{ minWidth: "150px" }}
          ></Column>
          <Column
            field="email"
            header="Email"
            sortable
            style={{ minWidth: "200px" }}
          ></Column>
          <Column
            field="predeter"
            header="Predet."
            sortable
            body={(rowData) => (
              <i
                className={`pi ${
                  rowData.predeter
                    ? "pi-check-circle text-green-500"
                    : "pi-circle text-gray-400"
                }`}
              ></i>
            )}
            style={{ minWidth: "80px", textAlign: "center" }}
          ></Column>
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "150px" }}
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
                <i className="pi pi-building mr-3 text-primary text-3xl"></i>
                Historial - {selectedAuditEmpresa?.nombre}
              </h2>
            </div>
          </div>
        }
        auditLogs={auditLogs}
        loading={auditLogsLoading}
      />

      <Dialog
        visible={empresaFormDialog}
        style={{ width: "850px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-building mr-3 text-primary text-3xl"></i>
                {empresa ? "Editar Empresa" : "Crear Empresa"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideEmpresaFormDialog}
      >
        <EmpresaForm
          empresa={empresa}
          onSave={handleSave}
          onCancel={hideEmpresaFormDialog}
          toast={toast}
        />
      </Dialog>

      <Dialog
        visible={deleteEmpresaDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteEmpresaDialogFooter}
        onHide={hideDeleteEmpresaDialog}
      >
        <div className="flex align-items-center justify-content-center">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {empresa && (
            <span>
              ¿Estás seguro de que deseas eliminar <b>{empresa.nombre}</b>?
            </span>
          )}
        </div>
      </Dialog>
      {/* ── Panel de gestión de roles dinámicos ── */}
      {selectedRolesEmpresa && (
        <EmpresaRoles
          visible={rolesDialogVisible}
          onHide={() => {
            setRolesDialogVisible(false);
            setSelectedRolesEmpresa(null);
          }}
          empresaId={selectedRolesEmpresa.id_empresa}
          empresaNombre={selectedRolesEmpresa.nombre}
          toast={toast}
        />
      )}
    </motion.div>
  );
};

export default EmpresasList;
