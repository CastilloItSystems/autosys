"use client";
import React, { useEffect, useRef, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { Menu } from "primereact/menu";
import type { MenuItem } from "primereact/menuitem";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
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
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import { handleFormError } from "@/utils/errorHandlers";

const ReservationList = () => {
  // Data state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<
    ReservationStatus | undefined
  >(undefined);

  // Dialog state
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [consumeDialog, setConsumeDialog] = useState(false);
  const [releaseDialog, setReleaseDialog] = useState(false);

  // Action state
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [consumeQuantity, setConsumeQuantity] = useState<number>(1);
  const [releaseReason, setReleaseReason] = useState("");
  const [actionItem, setActionItem] = useState<Reservation | null>(null);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);

  // Load initial data
  useEffect(() => {
    loadItems();
    loadWarehouses();
    loadReservations();
  }, []);

  // Reload when filters change
  useEffect(() => {
    setPage(0);
    loadReservations();
  }, [selectedStatus]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const res = await reservationService.getAll(
        page + 1,
        rows,
        selectedStatus || undefined,
        undefined,
        undefined,
      );
      console.log(res);
      setReservations(res.data ?? []);
      setTotalRecords(res.meta?.total ?? 0);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar reservas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const res = await itemService.getActive();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await warehouseService.getActive();
      setWarehouses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const handleSave = async () => {
    await loadReservations();
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedReservation ? "Reserva actualizada" : "Reserva creada",
      life: 3000,
    });
    setFormDialog(false);
    setSelectedReservation(null);
  };

  const openNew = () => {
    setSelectedReservation(null);
    setFormDialog(true);
  };

  const editReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setFormDialog(true);
  };

  const confirmDeleteItem = (item: Reservation) => {
    setSelectedReservation(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedReservation) return;
    setIsDeleting(true);
    try {
      await reservationService.delete(selectedReservation.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Reserva eliminada",
        life: 3000,
      });
      await loadReservations();
      setDeleteDialog(false);
      setSelectedReservation(null);
    } catch (e: any) {
      handleFormError(e, toast);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConsumeClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setConsumeQuantity(1);
    setConsumeDialog(true);
  };

  const handleConsume = async () => {
    if (!selectedReservation) return;
    setIsSubmitting(true);
    try {
      await reservationService.consume(selectedReservation.id, consumeQuantity);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Reserva consumida",
        life: 3000,
      });
      await loadReservations();
      setConsumeDialog(false);
      setSelectedReservation(null);
    } catch (error: any) {
      handleFormError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setReleaseReason("");
    setReleaseDialog(true);
  };

  const handleRelease = async () => {
    if (!selectedReservation) return;
    setIsSubmitting(true);
    try {
      await reservationService.release(selectedReservation.id, releaseReason);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Reserva liberada",
        life: 3000,
      });
      await loadReservations();
      setReleaseDialog(false);
      setSelectedReservation(null);
    } catch (error: any) {
      handleFormError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPending = async (reservation: Reservation) => {
    setIsSubmitting(true);
    try {
      await reservationService.markAsPendingPickup(reservation.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Marcado como pendiente de retiro",
        life: 3000,
      });
      await loadReservations();
    } catch (error: any) {
      handleFormError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Menu items based on status
  const getMenuItems = (item: Reservation | null): MenuItem[] => {
    if (!item) return [];
    const terminal = [
      ReservationStatus.CONSUMED,
      ReservationStatus.RELEASED,
    ].includes(item.status);
    const menuItems: MenuItem[] = [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => editReservation(item),
        disabled: terminal,
      },
      { separator: true },
    ];

    if (item.status === ReservationStatus.ACTIVE) {
      menuItems.push({
        label: "Pdte. Retiro",
        icon: "pi pi-clock",
        command: () => handleMarkPending(item),
      });
    }

    if (
      [ReservationStatus.ACTIVE, ReservationStatus.PENDING_PICKUP].includes(
        item.status,
      )
    ) {
      menuItems.push({
        label: "Consumir",
        icon: "pi pi-check",
        command: () => handleConsumeClick(item),
      });
      menuItems.push({
        label: "Liberar",
        icon: "pi pi-arrow-left",
        command: () => handleReleaseClick(item),
      });
    }

    if (!terminal) {
      menuItems.push({ separator: true });
      menuItems.push({
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => confirmDeleteItem(item),
      });
    }

    return menuItems;
  };

  // Column templates
  const statusBodyTemplate = (rowData: Reservation) => {
    const config = RESERVATION_STATUS_CONFIG[rowData.status];
    const isExpired =
      rowData.expiresAt &&
      new Date(rowData.expiresAt) < new Date() &&
      rowData.status === ReservationStatus.ACTIVE;

    return (
      <div className="flex flex-column gap-2">
        <Tag value={config.label} severity={config.severity} />
        {isExpired && <Tag value="VENCIDA" severity="danger" />}
      </div>
    );
  };

  const expiresAtBodyTemplate = (rowData: Reservation) => {
    if (!rowData.expiresAt) return "-";
    const date = new Date(rowData.expiresAt);
    return date.toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const reservedAtBodyTemplate = (rowData: Reservation) => {
    const date = new Date(rowData.reservedAt);
    return date.toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const orderRefBodyTemplate = (rowData: Reservation) => {
    return rowData.workOrderId || rowData.saleOrderId || "—";
  };

  const actionBodyTemplate = (rowData: Reservation) => (
    <>
      <Button
        icon="pi pi-cog"
        rounded
        text
        severity="secondary"
        onClick={(e) => {
          setActionItem(rowData);
          menuRef.current?.toggle(e);
        }}
      />
      <Menu
        ref={menuRef}
        id={`reservation-menu-${rowData.id}`}
        model={getMenuItems(actionItem?.id === rowData.id ? actionItem : null)}
        popup
      />
    </>
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <Dropdown
        value={selectedStatus}
        options={Object.values(ReservationStatus).map((s) => ({
          label: RESERVATION_STATUS_CONFIG[s].label,
          value: s,
        }))}
        optionLabel="label"
        optionValue="value"
        onChange={(e) => setSelectedStatus(e.value)}
        placeholder="Filtrar por estado"
        showClear
        className="w-12rem"
      />
      <CreateButton onClick={openNew} label="Nueva Reserva" />
    </div>
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card"
      >
        <DataTable
          lazy
          value={reservations}
          header={header}
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          onPage={(e) => {
            setPage(e.page ?? 0);
            setRows(e.rows);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          scrollable
          emptyMessage="No hay reservas disponibles"
          stripedRows
          size="small"
        >
          <Column
            field="reservationNumber"
            header="Nro. Reserva"
            sortable
            style={{ width: "12%" }}
          />
          <Column
            header="Producto"
            body={(rowData) => {
              if (rowData.item?.name) return rowData.item.name;
              const item = items.find((i) => i.id === rowData.itemId);
              return item?.name ?? rowData.itemId;
            }}
            style={{ width: "18%" }}
          />
          <Column
            header="Almacén"
            body={(rowData) => {
              if (rowData.warehouse?.name) return rowData.warehouse.name;
              const warehouse = warehouses.find(
                (w) => w.id === rowData.warehouseId,
              );
              return warehouse?.name ?? rowData.warehouseId;
            }}
            style={{ width: "14%" }}
          />
          <Column
            field="quantity"
            header="Cantidad"
            align="center"
            style={{ width: "10%" }}
          />
          <Column
            header="Reservado"
            body={reservedAtBodyTemplate}
            style={{ width: "12%" }}
          />
          <Column
            header="Vencimiento"
            body={expiresAtBodyTemplate}
            style={{ width: "12%" }}
          />
          <Column
            header="OT / Orden"
            body={orderRefBodyTemplate}
            style={{ width: "10%" }}
          />
          <Column
            header="Estado"
            body={statusBodyTemplate}
            align="center"
            style={{ width: "12%" }}
          />
          <Column
            body={actionBodyTemplate}
            align="center"
            style={{ width: "10%" }}
            exportable={false}
          />
        </DataTable>

        {/* Form Dialog */}
        <Dialog
          visible={formDialog}
          style={{ width: "75vw" }}
          breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
          maximizable
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center">
                  <i className="pi pi-bookmark mr-3 text-primary text-3xl" />
                  {selectedReservation ? "Editar Reserva" : "Nueva Reserva"}
                </h2>
              </div>
            </div>
          }
          footer={
            <FormActionButtons
              formId="reservation-form"
              isUpdate={!!selectedReservation?.id}
              onCancel={() => {
                setFormDialog(false);
                setSelectedReservation(null);
              }}
              isSubmitting={isSubmitting}
            />
          }
          onHide={() => {
            setFormDialog(false);
            setSelectedReservation(null);
          }}
          modal
        >
          <ReservationForm
            reservation={selectedReservation}
            formId="reservation-form"
            onSave={handleSave}
            onSubmittingChange={setIsSubmitting}
            toast={toast}
            items={items}
            warehouses={warehouses}
          />
        </Dialog>

        {/* Delete Dialog */}
        <DeleteConfirmDialog
          visible={deleteDialog}
          onHide={() => {
            setDeleteDialog(false);
            setSelectedReservation(null);
          }}
          onConfirm={handleDelete}
          itemName={selectedReservation?.reservationNumber}
          isDeleting={isDeleting}
        />

        {/* Consume Dialog */}
        <Dialog
          visible={consumeDialog}
          style={{ width: "450px" }}
          breakpoints={{ "1400px": "450px", "900px": "60vw", "600px": "90vw" }}
          maximizable
          header="Consumir Reserva"
          modal
          onHide={() => {
            setConsumeDialog(false);
            setSelectedReservation(null);
          }}
        >
          <div className="grid p-fluid">
            <div className="col-12">
              <label className="font-bold block mb-2">
                Cantidad a Consumir
              </label>
              <InputNumber
                value={consumeQuantity}
                onValueChange={(e) => setConsumeQuantity(e.value ?? 1)}
                min={1}
                max={selectedReservation?.quantity ?? 1}
                showButtons
              />
            </div>
          </div>
          <div className="flex w-full gap-2 mt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text flex-1"
              onClick={() => {
                setConsumeDialog(false);
                setSelectedReservation(null);
              }}
            />
            <Button
              label="Consumir"
              icon={isSubmitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
              className="p-button-success flex-1"
              onClick={handleConsume}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
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
          onHide={() => {
            setReleaseDialog(false);
            setSelectedReservation(null);
          }}
        >
          <div>
            <p className="mb-3">
              ¿Liberar {selectedReservation?.reservationNumber}?
            </p>
            <InputTextarea
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              placeholder="Motivo de liberación (opcional)"
              rows={3}
              className="w-full"
            />
          </div>
          <div className="flex w-full gap-2 mt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text flex-1"
              onClick={() => {
                setReleaseDialog(false);
                setSelectedReservation(null);
              }}
            />
            <Button
              label="Liberar"
              icon={isSubmitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
              className="p-button-warning flex-1"
              onClick={handleRelease}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </div>
        </Dialog>

        <Menu model={getMenuItems(actionItem)} popup ref={menuRef} />
      </motion.div>
    </>
  );
};

export default ReservationList;
