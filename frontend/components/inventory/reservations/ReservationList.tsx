"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";

import reservationService from "@/app/api/inventory/reservationService";
import itemService, { Item } from "@/app/api/inventory/itemService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import {
  Reservation,
  ReservationStatus,
  RESERVATION_STATUS_CONFIG,
} from "@/libs/interfaces/inventory/reservation.interface";
import ReservationForm from "./ReservationForm";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const ReservationList = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    ReservationStatus | undefined
  >(undefined);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});

  // Dialogs
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [consumeDialog, setConsumeDialog] = useState(false);
  const [releaseDialog, setReleaseDialog] = useState(false);
  const [consumeQuantity, setConsumeQuantity] = useState<number>(1);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const toast = useRef<Toast>(null);
  const dt = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, globalFilterValue, selectedStatus]);

  const fetchData = async () => {
    try {
      const [resRes, itemRes, whRes] = await Promise.all([
        reservationService.getAll(1, 100),
        itemService.getActive(),
        warehouseService.getActive(),
      ]);

      setReservations(Array.isArray(resRes.data) ? resRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
      setWarehouses(Array.isArray(whRes.data) ? whRes.data : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    const filtered = reservations.filter((res) => {
      const matchesSearch =
        !globalFilterValue ||
        res.id.toLowerCase().includes(globalFilterValue.toLowerCase()) ||
        res.itemId.toLowerCase().includes(globalFilterValue.toLowerCase());

      const matchesStatus = !selectedStatus || res.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    setFilters({
      global: { value: globalFilterValue, matchMode: FilterMatchMode.CONTAINS },
    });
  };

  const getItemName = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item
      ? item.sku
        ? `${item.sku} - ${item.name}`
        : item.name
      : itemId;
  };

  const getWarehouseName = (warehouseId: string) => {
    const wh = warehouses.find((w) => w.id === warehouseId);
    return wh ? wh.name : warehouseId;
  };

  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const openFormDialog = () => {
    setSelectedReservation(null);
    setFormDialog(true);
  };

  const hideFormDialog = () => {
    setSelectedReservation(null);
    setFormDialog(false);
  };

  const showToast = (
    severity: "success" | "error",
    summary: string,
    detail: string,
  ) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleConsumeClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setConsumeQuantity(reservation.quantity);
    setConsumeDialog(true);
  };

  const handleConsume = async () => {
    if (!selectedReservation) return;
    try {
      setActionInProgress(selectedReservation.id);
      const result = await reservationService.consume(
        selectedReservation.id,
        consumeQuantity,
      );
      const updated = result.data || result;
      setReservations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      showToast("success", "Éxito", "Reserva consumida");
      setConsumeDialog(false);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReleaseClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setReleaseDialog(true);
  };

  const handleRelease = async () => {
    if (!selectedReservation) return;
    try {
      setActionInProgress(selectedReservation.id);
      const result = await reservationService.release(selectedReservation.id);
      const updated = result.data || result;
      setReservations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      showToast("success", "Éxito", "Reserva liberada");
      setReleaseDialog(false);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePendingPickup = async (reservation: Reservation) => {
    try {
      setActionInProgress(reservation.id);
      const result = await reservationService.markAsPendingPickup(
        reservation.id,
      );
      const updated = result.data || result;
      setReservations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      showToast("success", "Éxito", "Marcado como pendiente de recolección");
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedReservation) return;
    try {
      await reservationService.delete(selectedReservation.id);
      setReservations(
        reservations.filter((r) => r.id !== selectedReservation.id),
      );
      showToast("success", "Éxito", "Reserva eliminada");
      setDeleteDialog(false);
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  // Templates
  const statusBodyTemplate = (rowData: Reservation) => {
    const config = RESERVATION_STATUS_CONFIG[rowData.status];
    const expired =
      isExpired(rowData.expiresAt) &&
      rowData.status === ReservationStatus.ACTIVE;

    return (
      <div className="flex flex-column gap-2">
        <Tag value={config.label} severity={config.severity} />
        {expired && <Tag value="VENCIDA" severity="danger" />}
      </div>
    );
  };

  const itemBodyTemplate = (rowData: Reservation) => (
    <span>{getItemName(rowData.itemId)}</span>
  );

  const warehouseBodyTemplate = (rowData: Reservation) => (
    <span>{getWarehouseName(rowData.warehouseId)}</span>
  );

  const expiresAtBodyTemplate = (rowData: Reservation) => {
    if (!rowData.expiresAt) return "-";
    const date = new Date(rowData.expiresAt);
    return date.toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const actionBodyTemplate = (rowData: Reservation) => {
    const isLoading = actionInProgress === rowData.id;

    return (
      <div className="flex gap-1 flex-nowrap">
        {/* ACTIVE → Consumir / Pendiente Recolección / Liberar */}
        {rowData.status === ReservationStatus.ACTIVE && (
          <>
            <Button
              icon="pi pi-check"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Consumir"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleConsumeClick(rowData)}
              loading={isLoading}
              disabled={isLoading}
            />
            <Button
              icon="pi pi-clock"
              className="p-button-rounded p-button-warning p-button-sm"
              tooltip="Pdte. Recolección"
              tooltipOptions={{ position: "top" }}
              onClick={() => handlePendingPickup(rowData)}
              loading={isLoading}
              disabled={isLoading}
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Liberar"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleReleaseClick(rowData)}
            />
          </>
        )}

        {/* PENDING_PICKUP → Consumir / Liberar */}
        {rowData.status === ReservationStatus.PENDING_PICKUP && (
          <>
            <Button
              icon="pi pi-check"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Consumir"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleConsumeClick(rowData)}
              loading={isLoading}
              disabled={isLoading}
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Liberar"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleReleaseClick(rowData)}
            />
          </>
        )}

        {/* CONSUMED / RELEASED → Solo vista */}
        {(rowData.status === ReservationStatus.CONSUMED ||
          rowData.status === ReservationStatus.RELEASED) && (
          <span className="text-600 text-sm">Solo lectura</span>
        )}
      </div>
    );
  };

  const statusOptions = Object.values(ReservationStatus).map((s) => ({
    label: RESERVATION_STATUS_CONFIG[s].label,
    value: s,
  }));

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex gap-2 align-items-center">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={(e) => setGlobalFilterValue(e.target.value)}
            placeholder="Buscar..."
            className="w-full sm:w-20rem"
          />
        </span>

        <Dropdown
          value={selectedStatus}
          options={statusOptions}
          optionLabel="label"
          optionValue="value"
          onChange={(e) => setSelectedStatus(e.value)}
          placeholder="Estado"
          showClear
          className="w-10rem"
        />
      </div>

      <CreateButton onClick={openFormDialog} label="Nueva Reserva" />
    </div>
  );

  const deleteDialogFooter = (
    <>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        text
        onClick={() => setDeleteDialog(false)}
      />
      <Button
        label="Eliminar"
        icon="pi pi-check"
        text
        severity="danger"
        onClick={handleDelete}
        loading={actionInProgress === selectedReservation?.id}
      />
    </>
  );

  const consumeDialogFooter = (
    <>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        text
        onClick={() => setConsumeDialog(false)}
      />
      <Button
        label="Consumir"
        icon="pi pi-check"
        text
        severity="success"
        onClick={handleConsume}
        loading={actionInProgress === selectedReservation?.id}
      />
    </>
  );

  const releaseDialogFooter = (
    <>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        text
        onClick={() => setReleaseDialog(false)}
      />
      <Button
        label="Liberar"
        icon="pi pi-check"
        text
        severity="warning"
        onClick={handleRelease}
        loading={actionInProgress === selectedReservation?.id}
      />
    </>
  );

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <ProgressSpinner />
      </div>
    );
  }

  const filteredReservations = reservations.filter((res) => {
    const matchesSearch =
      !globalFilterValue ||
      res.id.toLowerCase().includes(globalFilterValue.toLowerCase()) ||
      res.itemId.toLowerCase().includes(globalFilterValue.toLowerCase()) ||
      getItemName(res.itemId)
        .toLowerCase()
        .includes(globalFilterValue.toLowerCase());

    const matchesStatus = !selectedStatus || res.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Toast ref={toast} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={filteredReservations}
          header={header}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          emptyMessage="No hay reservas disponibles"
          stripedRows
          size="small"
        >
          <Column field="id" header="ID" sortable style={{ width: "12%" }} />
          <Column
            header="Producto"
            body={itemBodyTemplate}
            sortable
            style={{ width: "20%" }}
          />
          <Column
            header="Almacén"
            body={warehouseBodyTemplate}
            sortable
            style={{ width: "15%" }}
          />
          <Column
            field="quantity"
            header="Cantidad"
            sortable
            align="center"
            style={{ width: "10%" }}
          />
          <Column
            header="Vencimiento"
            body={expiresAtBodyTemplate}
            sortable
            style={{ width: "15%" }}
          />
          <Column
            header="Estado"
            body={statusBodyTemplate}
            align="center"
            style={{ width: "15%" }}
          />
          <Column
            body={actionBodyTemplate}
            align="center"
            style={{ width: "13%" }}
            exportable={false}
          />
        </DataTable>

        {/* Form Dialog */}
        <Dialog
          visible={formDialog}
          style={{ width: "850px" }}
          header={selectedReservation ? "Editar Reserva" : "Crear Reserva"}
          modal
          onHide={hideFormDialog}
        >
          <ReservationForm
            reservation={selectedReservation}
            hideFormDialog={hideFormDialog}
            reservations={reservations}
            setReservations={setReservations}
            showToast={showToast}
            toast={toast}
            items={items}
            warehouses={warehouses}
          />
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          visible={deleteDialog}
          style={{ width: "450px" }}
          breakpoints={{ "1400px": "450px", "900px": "60vw", "600px": "90vw" }}
          maximizable
          header="Confirmar Eliminación"
          modal
          footer={deleteDialogFooter}
          onHide={() => setDeleteDialog(false)}
        >
          <div className="flex align-items-center justify-content-center">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            <span>¿Estás seguro de que deseas eliminar esta reserva?</span>
          </div>
        </Dialog>

        {/* Consume Dialog */}
        <Dialog
          visible={consumeDialog}
          style={{ width: "450px" }}
          breakpoints={{ "1400px": "450px", "900px": "60vw", "600px": "90vw" }}
          maximizable
          header="Consumir Reserva"
          modal
          footer={consumeDialogFooter}
          onHide={() => setConsumeDialog(false)}
        >
          <div className="grid p-fluid">
            <div className="col-12">
              <label className="font-bold">Cantidad a Consumir</label>
              <InputText
                type="number"
                value={consumeQuantity.toString()}
                onChange={(e) =>
                  setConsumeQuantity(parseInt(e.target.value) || 1)
                }
                min={1}
                max={selectedReservation?.quantity || 1}
              />
            </div>
          </div>
        </Dialog>

        {/* Release Dialog */}
        <Dialog
          visible={releaseDialog}
          style={{ width: "450px" }}
          breakpoints={{ "1400px": "450px", "900px": "60vw", "600px": "90vw" }}
          maximizable
          header="Liberar Reserva"
          modal
          footer={releaseDialogFooter}
          onHide={() => setReleaseDialog(false)}
        >
          <div className="flex align-items-center justify-content-center">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            <span>¿Estás seguro de que deseas liberar esta reserva?</span>
          </div>
        </Dialog>
      </motion.div>
    </>
  );
};

export default ReservationList;
