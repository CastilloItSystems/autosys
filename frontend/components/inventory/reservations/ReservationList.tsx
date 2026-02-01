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
import {
  deleteReservation,
  getReservations,
} from "@/app/api/inventory/reservationService";
import ReservationForm from "./ReservationForm";
import { Reservation, Item, Warehouse } from "@/libs/interfaces/inventory";
import { getItems } from "@/app/api/inventory/itemService";
import { getWarehouses } from "@/app/api/inventory/warehouseService";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const ReservationList = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reservationsDB, itemsDB, warehousesDB] = await Promise.all([
        getReservations(),
        getItems(),
        getWarehouses(),
      ]);

      if (reservationsDB && Array.isArray(reservationsDB.reservations)) {
        setReservations(reservationsDB.reservations);
      }
      if (itemsDB && Array.isArray(itemsDB.items)) {
        setItems(itemsDB.items);
      }
      if (warehousesDB && Array.isArray(warehousesDB.warehouses)) {
        setWarehouses(warehousesDB.warehouses);
      }
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setReservation(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setReservation(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (reservation?.id) {
        await deleteReservation(reservation.id);
        setReservations(
          reservations.filter((val) => val.id !== reservation.id)
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Reserva Eliminada",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar la reserva",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setReservation(null);
      setDeleteDialog(false);
    }
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
      <CreateButton onClick={openFormDialog} />
    </div>
  );

  const actionBodyTemplate = (rowData: Reservation) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={(data) => {
        setReservation(rowData);
        setFormDialog(true);
      }}
      onDelete={(data) => {
        setReservation(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  const estadoBodyTemplate = (rowData: Reservation) => {
    const estadoColors: Record<string, string> = {
      activo: "bg-green-100 text-green-900",
      liberado: "bg-blue-100 text-blue-900",
      consumido: "bg-orange-100 text-orange-900",
      cancelado: "bg-red-100 text-red-900",
    };

    return (
      <span
        className={`px-2 py-1 border-round text-sm font-semibold ${
          estadoColors[rowData.estado || "activo"] ||
          "bg-gray-100 text-gray-900"
        }`}
      >
        {rowData.estado}
      </span>
    );
  };

  const showToast = (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const deleteDialogFooter = (
    <>
      <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
      <Button label="Sí" icon="pi pi-check" text onClick={handleDelete} />
    </>
  );

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
          value={reservations}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay reservas disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="item.nombre" header="Artículo" sortable />
          <Column field="warehouse.nombre" header="Almacén" sortable />
          <Column field="cantidad" header="Cantidad" sortable />
          <Column field="reservadoPor" header="Reservado Por" sortable />
          <Column field="motivo" header="Motivo" sortable />
          <Column
            field="estado"
            header="Estado"
            body={estadoBodyTemplate}
            sortable
          />
        </DataTable>

        <Dialog
          visible={deleteDialog}
          style={{ width: "450px" }}
          header="Confirmar"
          modal
          footer={deleteDialogFooter}
          onHide={hideDeleteDialog}
        >
          <div className="flex align-items-center justify-content-center">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {reservation && (
              <span>¿Estás seguro de que deseas eliminar esta reserva?</span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "850px" }}
          header={reservation ? "Editar Reserva" : "Crear Reserva"}
          modal
          onHide={hideFormDialog}
          content={
            <ReservationForm
              reservation={reservation}
              hideFormDialog={hideFormDialog}
              reservations={reservations}
              setReservations={setReservations}
              setReservation={setReservation}
              showToast={showToast}
              toast={toast}
              items={items}
              warehouses={warehouses}
            />
          }
        ></Dialog>
      </motion.div>
    </>
  );
};

export default ReservationList;
