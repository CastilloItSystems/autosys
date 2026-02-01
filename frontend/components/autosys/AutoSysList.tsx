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
import AutoSysForm from "./AutoSysForm";
import CustomActionButtons from "../common/CustomActionButtons";
import AuditHistoryDialog from "../common/AuditHistoryDialog";
import { motion } from "framer-motion";
import { ProgressSpinner } from "primereact/progressspinner";
import { AutoSys } from "@/libs/interfaces/autoSysInterface";
import { deleteAutoSys, getAutoSyss } from "@/app/api/autoSysService";

const AutoSysList = () => {
  const [autoSyss, setAutoSyss] = useState<AutoSys[]>([]);
  const [autoSys, setAutoSys] = useState<AutoSys | null>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [autoSysFormDialog, setAutoSysFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditAutoSys, setSelectedAuditAutoSys] =
    useState<AutoSys | null>(null);
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
    const fetchAutoSyss = async () => {
      const autoSyssDB = await getAutoSyss();
      console.log("autoSys", autoSyssDB);
      const { autoSys } = autoSyssDB;
      setAutoSyss(autoSys);
      setLoading(false);
      initFilters();
    };

    fetchAutoSyss();
  }, []);

  const hideDeleteProductDialog = () => {
    setDeleteProductDialog(false);
  };

  const hideAutoSysFormDialog = () => {
    setAutoSysFormDialog(false);
  };

  const deleteProduct = async () => {
    let AutoSyss = autoSyss.filter((val) => val.id !== autoSys?.id);
    if (autoSys?.id) {
      const autoSysEliminado = await deleteAutoSys(autoSys.id);
      setAutoSyss(AutoSyss);
      setDeleteProductDialog(false);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Taller Eliminado",
        life: 3000,
      });
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar el taller",
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

  const deleteProductDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        text
        onClick={hideDeleteProductDialog}
      />
      <Button label="Yes" icon="pi pi-check" text onClick={deleteProduct} />
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
          icon="pi pi-user-plus"
          label="Crear Taller"
          outlined
          className="w-full sm:w-auto flex-order-0 sm:flex-order-1"
          onClick={() => router.push("/all-autoSys/create")}
        />
      </div>
    );
  };

  const header = renderHeader();

  const editAutoSys = (autoSys: any) => {
    setAutoSys(autoSys);
    setAutoSysFormDialog(true);
  };

  const confirmDeleteProduct = (autoSys: any) => {
    setAutoSys(autoSys);
    setDeleteProductDialog(true);
  };

  const actionBodyTemplate = (rowData: any) => {
    return (
      <CustomActionButtons
        rowData={rowData}
        onInfo={(data) => {
          setSelectedAuditAutoSys(data);
          setAuditDialogVisible(true);
        }}
        onEdit={(data) => {
          setAutoSys(rowData);
          data;
          setAutoSysFormDialog(true);
        }}
        onDelete={(data) => {
          setAutoSys(rowData);
          data;
          setDeleteProductDialog(true);
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
          value={autoSyss}
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
            field="ubicacion"
            header="Ubicación"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="rif"
            header="RIF"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="telefono"
            header="Teléfono"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="procesamientoDia"
            header="Capacidad/Día"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="legal"
            header="Rep. Legal"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
        </DataTable>

        <AuditHistoryDialog
          visible={auditDialogVisible}
          onHide={() => setAuditDialogVisible(false)}
          title={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                  Historial - {selectedAuditAutoSys?.nombre}
                </h2>
              </div>
            </div>
          }
          createdBy={selectedAuditAutoSys?.createdBy!}
          createdAt={selectedAuditAutoSys?.createdAt!}
          historial={selectedAuditAutoSys?.historial}
        />

        <Dialog
          visible={deleteProductDialog}
          style={{ width: "450px" }}
          header="Confirmar"
          modal
          footer={deleteProductDialogFooter}
          onHide={hideDeleteProductDialog}
        >
          <div className="flex align-items-center justify-content-center">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {autoSys && (
              <span>
                ¿Estás seguro de que deseas eliminar <b>{autoSys.nombre}</b>?
              </span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={autoSysFormDialog}
          style={{ width: "850px" }}
          header="Editar Taller"
          modal
          onHide={hideAutoSysFormDialog}
        >
          <AutoSysForm
            autoSys={autoSys}
            hideAutoSysFormDialog={hideAutoSysFormDialog}
            autoSyss={autoSyss}
            setAutoSyss={setAutoSyss}
          />
        </Dialog>
      </motion.div>
    </>
  );
};

export default AutoSysList;
