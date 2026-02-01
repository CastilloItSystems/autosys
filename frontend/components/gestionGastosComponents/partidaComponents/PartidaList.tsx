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
import { useRefineriaStore } from "@/store/refineriaStore";
import CustomActionButtons from "@/components/common/CustomActionButtons";

import PartidaForm from "./PartidaForm";
import { Partida, Tanque } from "@/libs/interfaces";
import { formatDateFH } from "@/utils/dateUtils";
import { deletePartida, getPartidas } from "@/app/api/partidaService";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";

const PartidaList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [partida, setPartida] = useState<Partida | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [partidaFormDialog, setPartidaFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditPartida, setSelectedAuditPartida] =
    useState<Partida | null>(null);

  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchPartidas();
  }, [activeRefineria]);

  const fetchPartidas = async () => {
    try {
      const partidasDB = await getPartidas();
      if (partidasDB && Array.isArray(partidasDB.partidas)) {
        setPartidas(partidasDB.partidas);
      } else {
        console.error("La estructura de partidasDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los partidas:", error);
    } finally {
      setLoading(false);
    }
  };
  const openPartidaFormDialog = () => {
    setPartida(null); // Limpia la partida seleccionada
    setPartidaFormDialog(true);
  };
  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hidePartidaFormDialog = () => {
    setPartida(null);
    setPartidaFormDialog(false);
  };

  const handleDeletePartida = async () => {
    if (partida?.id) {
      await deletePartida(partida.id);
      setPartidas(partidas.filter((val) => val.id !== partida.id));
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Partida Eliminada",
        life: 3000,
      });
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la torre de destilación",
        life: 3000,
      });
    }
    setPartida(null);
    setDeleteProductDialog(false);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
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
        label="Agregar Nuevo"
        outlined
        className="w-full sm:w-auto flex-order-0 sm:flex-order-1"
        onClick={openPartidaFormDialog}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: Partida) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditPartida(data);
        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setPartida(data);
        setPartidaFormDialog(true);
      }}
      onDelete={(data) => {
        setPartida(data);
        setDeleteProductDialog(true);
      }}
    />
  );
  const productoBodyTemplate = (rowData: Tanque) => {
    const { idProducto } = rowData;
    return (
      <div>
        <span
          className={"customer-badge"}
          style={{ backgroundColor: `#${idProducto?.color}50` }}
        >
          {idProducto?.nombre}
        </span>
      </div>
    );
  };
  const showToast = (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };
  return (
    <div className="card">
      <Toast ref={toast} />
      <DataTable
        ref={dt}
        value={partidas}
        header={renderHeader()}
        paginator
        rows={10}
        responsiveLayout="scroll"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
        rowsPerPageOptions={[10, 25, 50]}
        filters={filters}
        loading={loading}
        emptyMessage="No hay partidas disponibles"
      >
        <Column body={actionBodyTemplate} />
        <Column field="codigo" header="Codigo" sortable />
        <Column
          field="color"
          header="Color"
          body={(rowData: Partida) => (
            <div className="flex items-center">
              <div
                className=" h-6 rounded-full mr-2"
                style={{ backgroundColor: `#${rowData.color}` }}
              >
                <span>{rowData.color}</span>
              </div>
            </div>
          )}
        />
        {/* <Column
          field="ubicacion"
          header="Ubicación"
          sortable
         
        /> */}

        <Column field="descripcion" header="Descripcion" sortable />
        {/* <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: Partida) => formatDateFH(rowData.createdAt)}
          sortable
          style={{ width: "25%" }}
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: Partida) => formatDateFH(rowData.updatedAt)}
          sortable
          style={{ width: "25%" }}
        /> */}
      </DataTable>

      <Dialog
        visible={deleteProductDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={
          <>
            <Button
              label="No"
              icon="pi pi-times"
              text
              onClick={hideDeleteProductDialog}
            />
            <Button
              label="Sí"
              icon="pi pi-check"
              text
              onClick={handleDeletePartida}
            />
          </>
        }
        onHide={hideDeleteProductDialog}
      >
        <div className="flex align-items-center justify-content-center">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {partida && (
            <span>
              ¿Estás seguro de que deseas eliminar <b>{partida.descripcion}</b>?
            </span>
          )}
        </div>
      </Dialog>
      <AuditHistoryDialog
        visible={auditDialogVisible}
        onHide={() => setAuditDialogVisible(false)}
        title={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                Historial - {selectedAuditPartida?.descripcion}
              </h2>
            </div>
          </div>
        }
        createdBy={selectedAuditPartida?.createdBy!}
        createdAt={selectedAuditPartida?.createdAt!}
        historial={selectedAuditPartida?.historial}
      />
      <Dialog
        visible={partidaFormDialog}
        style={{ width: "850px" }}
        header={`${partida ? "Editar" : "Agregar"} Recepción de tractomula.
`}
        modal
        onHide={hidePartidaFormDialog}
        content={() => (
          <PartidaForm
            partida={partida}
            hidePartidaFormDialog={hidePartidaFormDialog}
            partidas={partidas}
            setPartidas={setPartidas}
            setPartida={setPartida}
            showToast={showToast}
            toast={toast}
          />
        )}
      ></Dialog>
    </div>
  );
};

export default PartidaList;
