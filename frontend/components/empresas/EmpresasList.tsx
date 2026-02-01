"use client";
import { useRouter } from "next/navigation";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import EmpresaForm from "./EmpresaForm";
import CustomActionButtons from "../common/CustomActionButtons";
import AuditHistoryDialog from "../common/AuditHistoryDialog";
import { motion } from "framer-motion";
import { ProgressSpinner } from "primereact/progressspinner";
import { Empresa } from "@/libs/interfaces/empresaInterface";
import { deleteEmpresa, getEmpresas } from "@/app/api/empresaService";

const EmpresasList = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteEmpresaDialog, setDeleteEmpresaDialog] = useState(false);
  const [empresaFormDialog, setEmpresaFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditEmpresa, setSelectedAuditEmpresa] =
    useState<Empresa | null>(null);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  const initFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue("");
  };

  useEffect(() => {
    const fetchEmpresas = async () => {
      const empresasDB = await getEmpresas();
      console.log("empresas", empresasDB);
      setEmpresas(empresasDB);
      setLoading(false);
      initFilters();
    };

    fetchEmpresas();
  }, []);

  const hideDeleteEmpresaDialog = () => {
    setDeleteEmpresaDialog(false);
  };

  const hideEmpresaFormDialog = () => {
    setEmpresaFormDialog(false);
  };

  const deleteEmpresaAction = async () => {
    let empresasFiltradas = empresas.filter(
      (val) => val.id_empresa !== empresa?.id_empresa,
    );
    if (empresa?.id_empresa) {
      const empresaEliminada = await deleteEmpresa(empresa.id_empresa);
      setEmpresas(empresasFiltradas);
      setDeleteEmpresaDialog(false);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Empresa Eliminada",
        life: 3000,
      });
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la empresa",
        life: 3000,
      });
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let _filters = { ...filters };
    (_filters["global"] as any).value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const deleteEmpresaDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        text
        onClick={hideDeleteEmpresaDialog}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        text
        onClick={deleteEmpresaAction}
      />
    </>
  );

  const renderHeader = () => {
    return (
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
        <span className="p-input-icon-left w-full sm:w-20rem flex-order-1 sm:flex-order-0">
          <i className="pi pi-search"></i>
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Búsqueda Global"
            className="w-full"
          />
        </span>
        <Button
          type="button"
          icon="pi pi-building"
          label="Crear Empresa"
          outlined
          className="w-full sm:w-auto flex-order-0 sm:flex-order-1"
          onClick={() => router.push("/empresas/create")}
        />
      </div>
    );
  };

  const header = renderHeader();

  const editEmpresa = (empresa: Empresa) => {
    setEmpresa(empresa);
    setEmpresaFormDialog(true);
  };

  const confirmDeleteEmpresa = (empresa: Empresa) => {
    setEmpresa(empresa);
    setDeleteEmpresaDialog(true);
  };

  const actionBodyTemplate = (rowData: Empresa) => {
    return (
      <CustomActionButtons
        rowData={rowData}
        onInfo={(data) => {
          setSelectedAuditEmpresa(data);
          setAuditDialogVisible(true);
        }}
        onEdit={(data) => {
          setEmpresa(rowData);
          setEmpresaFormDialog(true);
        }}
        onDelete={(data) => {
          setEmpresa(rowData);
          setDeleteEmpresaDialog(true);
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 40,
          filter: "blur(8px)",
        }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={empresas}
          header={header}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          rowClassName={(_, i) => `animated-row`}
          size="small"
        >
          <Column body={actionBodyTemplate}></Column>
          <Column
            field="nombre"
            header="Nombre"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="direccion"
            header="Dirección"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="numerorif"
            header="RIF"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="telefonos"
            header="Teléfonos"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="email"
            header="Email"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="contacto"
            header="Contacto"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="predeter"
            header="Predeterminada"
            sortable
            headerClassName="white-space-nowrap"
            body={(rowData) => (rowData.predeter ? "Sí" : "No")}
          ></Column>
        </DataTable>

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
          createdBy={selectedAuditEmpresa?.createdAt || ""}
          createdAt={selectedAuditEmpresa?.createdAt || ""}
          historial={[]} // Ajustar según tu modelo de historial
        />

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

        <Dialog
          visible={empresaFormDialog}
          style={{ width: "850px" }}
          header="Editar Empresa"
          modal
          onHide={hideEmpresaFormDialog}
        >
          <EmpresaForm
            empresa={empresa}
            hideEmpresaFormDialog={hideEmpresaFormDialog}
            empresas={empresas}
            setEmpresas={setEmpresas}
          />
        </Dialog>
      </motion.div>
    </>
  );
};

export default EmpresasList;
