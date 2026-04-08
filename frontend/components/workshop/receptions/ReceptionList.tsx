"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import { motion } from "framer-motion";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { receptionService } from "@/app/api/workshop";
import type {
  VehicleReception,
  ReceptionStatus,
} from "@/libs/interfaces/workshop";
import ReceptionForm from "./ReceptionForm";

const FUEL_LABELS: Record<string, string> = {
  EMPTY: "Vacío",
  QUARTER: "1/4",
  HALF: "1/2",
  THREE_QUARTERS: "3/4",
  FULL: "Lleno",
};

const STATUS_CONFIG: Record<
  ReceptionStatus,
  { label: string; severity: "warning" | "info" | "secondary" | "success" }
> = {
  OPEN: { label: "Abierta", severity: "warning" },
  DIAGNOSING: { label: "Diagnosticando", severity: "info" },
  QUOTED: { label: "Cotizada", severity: "secondary" },
  CONVERTED_TO_SO: { label: "OT generada", severity: "success" },
};

export default function ReceptionList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<VehicleReception[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<VehicleReception | null>(null);
  const [actionItem, setActionItem] = useState<VehicleReception | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preloadData, setPreloadData] = useState<{
    appointmentId?: string;
    customerId?: string;
    customerVehicleId?: string;
    advisorId?: string;
  } | null>(null);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => {
    const action = searchParams.get("action");
    const appointmentId = searchParams.get("appointmentId");
    const customerId = searchParams.get("customerId");
    const customerVehicleId = searchParams.get("customerVehicleId");
    const advisorId = searchParams.get("advisorId");

    if (action === "new" && appointmentId && customerId) {
      setPreloadData({
        appointmentId,
        customerId,
        customerVehicleId: customerVehicleId || undefined,
        advisorId: advisorId || undefined,
      });
      setSelected(null);
      setFormDialog(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadItems();
  }, [page, rows, searchQuery]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await receptionService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setItems(res.data ?? []);
      setTotalRecords(res.meta?.total ?? 0);
    } catch (error) {
      handleFormError(error, toast);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setPreloadData(null);
    setSelected(null);
    setFormDialog(true);
  };

  const editItem = async (item: VehicleReception) => {
    try {
      const res = await receptionService.getById(item.id);
      setSelected(res.data ?? item);
    } catch {
      setSelected({ ...item });
    }
    setFormDialog(true);
  };

  const confirmDelete = (item: VehicleReception) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await receptionService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Recepción eliminada",
        life: 3000,
      });
      await loadItems();
      setDeleteDialog(false);
      setSelected(null);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (newReceptionId?: string) => {
    await loadItems();
    if (newReceptionId) {
      // Auto-transición: mantener dialog abierto en modo edición
      try {
        const res = await receptionService.getById(newReceptionId);
        setSelected(res.data ?? null);
        setPreloadData(null);
        // El dialog permanece abierto con la recepción cargada en modo edición
      } catch {
        setFormDialog(false);
        setSelected(null);
        setPreloadData(null);
      }
    } else {
      setFormDialog(false);
      setSelected(null);
      setPreloadData(null);
    }
  };

  // ── Templates ──────────────────────────────────────────────────────────────

  const folioTemplate = (row: VehicleReception) => (
    <span className="font-bold text-primary">{row.folio}</span>
  );

  const statusTemplate = (row: VehicleReception) => {
    const cfg = STATUS_CONFIG[row.status];
    if (!cfg) return <span className="text-400">—</span>;
    return <Tag value={cfg.label} severity={cfg.severity} rounded />;
  };

  const customerTemplate = (row: VehicleReception) => (
    <div>
      <div className="font-semibold">{row.customer?.name ?? "—"}</div>
      <div className="text-xs text-500">{row.customer?.code}</div>
    </div>
  );

  const vehicleTemplate = (row: VehicleReception) => (
    <div>
      <div className="font-semibold">
        {row.customerVehicle?.plate ?? row.vehiclePlate ?? "—"}
      </div>
      {row.vehicleDesc && (
        <div className="text-xs text-500">{row.vehicleDesc}</div>
      )}
    </div>
  );

  const fuelTemplate = (row: VehicleReception) =>
    row.fuelLevel ? (
      <span className="px-2 py-1 surface-200 border-round text-sm">
        {FUEL_LABELS[row.fuelLevel] ?? row.fuelLevel}
      </span>
    ) : (
      <span className="text-500">—</span>
    );

  const damageTemplate = (row: VehicleReception) => (
    <Tag
      value={row.hasPreExistingDamage ? "Con daños" : "Sin daños"}
      severity={row.hasPreExistingDamage ? "warning" : "success"}
      rounded
    />
  );

  const orderTemplate = (row: VehicleReception) =>
    row.serviceOrder ? (
      <span className="font-bold text-primary">{row.serviceOrder.folio}</span>
    ) : (
      <span className="text-500">—</span>
    );

  const dateTemplate = (row: VehicleReception) =>
    new Date(row.createdAt).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const actionBodyTemplate = (rowData: VehicleReception) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      aria-haspopup
      onClick={(e) => {
        setActionItem(rowData);
        menuRef.current?.toggle(e);
      }}
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const isDeletable = (item: VehicleReception) => !item.serviceOrder;

  const isInEditMode = !!selected?.id;

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Recepciones de Vehículos</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Folio, cliente, placa..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            style={{ width: "16rem" }}
          />
        </span>
        <CreateButton
          label="Nueva recepción"
          onClick={openNew}
          tooltip="Registrar recepción de vehículo"
        />
      </div>
    </div>
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
          value={items}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 50]}
          onPage={(e) => {
            setPage(e.page ?? Math.floor(e.first / e.rows));
            setRows(e.rows);
          }}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron recepciones"
          sortMode="multiple"
          scrollable
          size="small"
        >
          <Column
            field="folio"
            header="Folio"
            sortable
            body={folioTemplate}
            style={{ minWidth: "100px" }}
          />
          <Column
            field="status"
            header="Estado"
            body={statusTemplate}
            style={{ minWidth: "130px" }}
          />
          <Column
            header="Cliente"
            body={customerTemplate}
            style={{ minWidth: "180px" }}
          />
          <Column
            header="Vehículo"
            body={vehicleTemplate}
            style={{ minWidth: "140px" }}
          />
          <Column
            field="mileageIn"
            header="Km entrada"
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Combustible"
            body={fuelTemplate}
            style={{ minWidth: "110px" }}
          />
          <Column
            header="Estado previo"
            body={damageTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            header="OT generada"
            body={orderTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="createdAt"
            header="Fecha"
            body={dateTemplate}
            sortable
            style={{ minWidth: "110px" }}
          />
          <Column
            header="Acciones"
            body={actionBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={formDialog}
        style={{ width: isInEditMode ? "75vw" : "55vw" }}
        breakpoints={{
          "1200px": isInEditMode ? "80vw" : "65vw",
          "900px": "90vw",
          "600px": "95vw",
        }}
        maximizable
        header={
          <div className="flex align-items-center gap-3">
            <i className="pi pi-car text-primary text-xl" />
            <span className="text-xl font-bold text-900">
              {selected?.id
                ? `Recepción ${selected.folio}`
                : preloadData
                ? "Recepción desde Cita"
                : "Nueva Recepción"}
            </span>
            {selected?.id && selected.status && (
              <Tag
                value={STATUS_CONFIG[selected.status]?.label ?? selected.status}
                severity={STATUS_CONFIG[selected.status]?.severity ?? "info"}
                rounded
              />
            )}
          </div>
        }
        modal
        className="p-fluid"
        contentStyle={{
          padding: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onHide={() => {
          setFormDialog(false);
          setSelected(null);
          setPreloadData(null);
        }}
        footer={
          <FormActionButtons
            formId="reception-form"
            isUpdate={!!selected?.id}
            onCancel={() => {
              setFormDialog(false);
              setSelected(null);
              setPreloadData(null);
            }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ReceptionForm
          reception={selected}
          onSave={handleSave}
          formId="reception-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
          preloadData={preloadData ?? undefined}
        />
      </Dialog>

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setSelected(null);
        }}
        onConfirm={handleDelete}
        itemName={selected?.folio}
        isDeleting={isDeleting}
      />

      <Menu
        model={
          actionItem
            ? [
                {
                  label: "Editar",
                  icon: "pi pi-pencil",
                  command: () => editItem(actionItem),
                },
                { separator: true },
                {
                  label: "Generar OT",
                  icon: "pi pi-wrench",
                  disabled: !!actionItem.serviceOrder,
                  command: () => {
                    const q = new URLSearchParams({
                      action: "new",
                      receptionId: actionItem.id,
                      customerId: actionItem.customerId,
                      customerVehicleId: actionItem.customerVehicleId || "",
                      vehiclePlate: actionItem.vehiclePlate || "",
                      mileageIn: actionItem.mileageIn?.toString() || "",
                    });
                    router.push(
                      `/empresa/workshop/service-orders?${q.toString()}`,
                    );
                  },
                },
                { separator: true },
                {
                  label: "Eliminar",
                  icon: "pi pi-trash",
                  className: "p-menuitem-danger",
                  disabled: !isDeletable(actionItem),
                  command: () => confirmDelete(actionItem),
                },
              ]
            : []
        }
        popup
        ref={menuRef}
        id="reception-menu"
      />
    </motion.div>
  );
}
