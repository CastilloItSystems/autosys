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
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { motion } from "framer-motion";
import { ProgressSpinner } from "primereact/progressspinner";

import EmpresaForm from "./EmpresaForm";
import EmpresaRoles from "./EmpresaRoles";
import AuditHistoryDialog from "../common/AuditHistoryDialog";
import FormActionButtons from "../common/FormActionButtons";
import DeleteConfirmDialog from "../common/DeleteConfirmDialog";
import CreateButton from "../common/CreateButton";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [empresaFormDialog, setEmpresaFormDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);

  const [selectedAuditEmpresa, setSelectedAuditEmpresa] =
    useState<Empresa | null>(null);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  // Estado para el panel de roles dinámicos
  const [rolesDialogVisible, setRolesDialogVisible] = useState(false);
  const [selectedRolesEmpresa, setSelectedRolesEmpresa] =
    useState<Empresa | null>(null);

  const [actionEmpresa, setActionEmpresa] = useState<Empresa | null>(null);
  const menuRef = useRef<Menu>(null);

  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  const initFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue("");
  };

  const normalizeEmpresa = (e: any): Empresa => {
    return {
      ...e,
      direccion: e.direccion ?? undefined,
      telefonos: e.telefonos ?? undefined,
      fax: e.fax ?? undefined,
      numerorif: e.numerorif ?? undefined,
      numeronit: e.numeronit ?? undefined,
      website: e.website ?? undefined,
      email: e.email ?? undefined,
      contacto: e.contacto ?? undefined,
      soporte1: e.soporte1 ?? undefined,
      soporte2: e.soporte2 ?? undefined,
      soporte3: e.soporte3 ?? undefined,
      data_servidor: e.data_servidor ?? undefined,
      data_usuario: e.data_usuario ?? undefined,
      data_password: e.data_password ?? undefined,
      data_port: e.data_port ?? undefined,
      licencia: e.licencia ?? undefined,
      masinfo: e.masinfo ?? undefined,
      name_prefijo: e.name_prefijo ?? undefined,
      dprefijobd: e.dprefijobd ?? undefined,
      dprefijosrv: e.dprefijosrv ?? undefined,
      dprefijousr: e.dprefijousr ?? undefined,
    } as Empresa;
  };

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const empresasDB = await getEmpresas();
      // Ajuste según la respuesta de tu backend: normalizamos null -> undefined
      const raw = (empresasDB?.empresas ?? empresasDB) || [];
      const normalized = (Array.isArray(raw) ? raw : []).map(normalizeEmpresa);
      setEmpresas(normalized);
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
    setIsSubmitting(false);
    setEmpresa(null);
  };

  const empresaFormFooter = (
    <FormActionButtons
      onCancel={hideEmpresaFormDialog}
      isUpdate={!!empresa}
      formId="empresa-form"
      isSubmitting={isSubmitting}
    />
  );

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
      setIsDeleting(true);
      try {
        await deleteEmpresa(empresa.id_empresa);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Empresa Eliminada",
          life: 3000,
        });
        fetchEmpresas();
        setDeleteEmpresaDialog(false);
        setEmpresa(null);
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar la empresa",
          life: 3000,
        });
      } finally {
        setIsDeleting(false);
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
        <CreateButton
          label="Nueva Empresa"
          onClick={openNew}
          tooltip="Agregar Nueva Empresa"
        />
      </div>
    </div>
  );

  const getMenuItems = (empresaItem: Empresa | null): MenuItem[] => {
    if (!empresaItem) return [];
    return [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => editEmpresa(empresaItem),
      },
      {
        label: "Gestionar Roles",
        icon: "pi pi-shield",
        command: () => {
          setSelectedRolesEmpresa(empresaItem);
          setRolesDialogVisible(true);
        },
      },
      {
        label: "Ver auditoría",
        icon: "pi pi-history",
        command: async () => {
          setSelectedAuditEmpresa(empresaItem);
          setAuditLogsLoading(true);
          try {
            const result = await getAuditLogsForEmpresa(empresaItem.id_empresa);
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
        },
      },
      {
        separator: true,
      },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-error",
        command: () => confirmDeleteEmpresa(empresaItem),
      },
    ];
  };

  const actionBodyTemplate = (rowData: Empresa) => {
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
            setActionEmpresa(rowData);
            menuRef.current?.toggle(e);
          }}
          aria-controls="popup_menu"
          aria-haspopup
        />
      </div>
    );
  };

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
        footer={empresaFormFooter}
        onHide={hideEmpresaFormDialog}
      >
        <EmpresaForm
          empresa={empresa}
          onSave={handleSave}
          onCancel={hideEmpresaFormDialog}
          toast={toast}
          formId="empresa-form"
          onSubmittingChange={setIsSubmitting}
        />
      </Dialog>

      <DeleteConfirmDialog
        visible={deleteEmpresaDialog}
        onHide={hideDeleteEmpresaDialog}
        onConfirm={deleteEmpresaAction}
        itemName={empresa?.nombre}
        isDeleting={isDeleting}
      />
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

      <Menu
        model={getMenuItems(actionEmpresa)}
        popup
        ref={menuRef}
        id="popup_menu"
      />
    </motion.div>
  );
};

export default EmpresasList;
