"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import { motion } from "framer-motion";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { deliveryService } from "@/app/api/workshop";
import type { VehicleDelivery } from "@/libs/interfaces/workshop";
import DeliveryForm from "./DeliveryForm";

export default function DeliveryList() {
  const [items, setItems] = useState<VehicleDelivery[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<VehicleDelivery | null>(null);
  const [actionItem, setActionItem] = useState<VehicleDelivery | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => {
    loadItems();
  }, [page, rows, searchQuery]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await deliveryService.getAll({
        page: page + 1,
        limit: rows,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      // getAll may return a list or paged response depending on backend
      const payload = res.data as any;
      if (Array.isArray(payload)) {
        setItems(payload);
        setTotalRecords(payload.length);
      } else if (payload?.data) {
        setItems(payload.data ?? []);
        setTotalRecords(payload.pagination?.total ?? 0);
      } else {
        setItems([]);
        setTotalRecords(0);
      }
    } catch (error) {
      handleFormError(error, toast);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setSelected(null);
    setFormDialog(true);
  };

  const editItem = (item: VehicleDelivery) => {
    setSelected({ ...item });
    setFormDialog(true);
  };

  const handleSave = () => {
    (async () => {
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Entrega registrada correctamente",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  // ── Column templates ────────────────────────────────────────────────────

  const folioTemplate = (row: VehicleDelivery) => (
    <span className="font-bold text-primary">
      {row.serviceOrder?.folio ?? row.serviceOrderId.slice(0, 8) + "..."}
    </span>
  );

  const receivedByTemplate = (row: VehicleDelivery) => (
    <span>{row.receivedByName ?? <span className="text-500">—</span>}</span>
  );

  const conformityTemplate = (row: VehicleDelivery) =>
    row.clientConformity ? (
      <Tag value="Sí" severity="success" rounded />
    ) : (
      <Tag value="No" severity="danger" rounded />
    );

  const nextVisitTemplate = (row: VehicleDelivery) =>
    row.nextVisitDate ? (
      new Date(row.nextVisitDate).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    ) : (
      <span className="text-500">—</span>
    );

  const createdAtTemplate = (row: VehicleDelivery) =>
    new Date(row.createdAt).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const actionBodyTemplate = (rowData: VehicleDelivery) => (
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

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <i className="pi pi-sign-out text-primary text-xl" />
        <h4 className="m-0">Entregas de Vehículos</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            style={{ width: "14rem" }}
          />
        </span>
        <CreateButton
          label="Nueva entrega"
          onClick={openNew}
          tooltip="Registrar entrega de vehículo"
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
          emptyMessage="No se encontraron entregas de vehículos"
          sortMode="multiple"
          scrollable
          size="small"
        >
          <Column
            header="OT / Folio"
            body={folioTemplate}
            style={{ minWidth: "140px" }}
          />
          <Column
            header="Recibido por"
            body={receivedByTemplate}
            style={{ minWidth: "160px" }}
          />
          <Column
            header="Conformidad"
            body={conformityTemplate}
            style={{ minWidth: "110px" }}
          />
          <Column
            header="Próxima visita"
            body={nextVisitTemplate}
            style={{ minWidth: "140px" }}
          />
          <Column
            header="Fecha de entrega"
            body={createdAtTemplate}
            style={{ minWidth: "140px" }}
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

      {/* Form Dialog */}
      <Dialog
        visible={formDialog}
        style={{ width: "640px" }}
        breakpoints={{ "900px": "80vw", "600px": "95vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-sign-out mr-3 text-primary text-3xl" />
                {selected?.id ? "Detalle de entrega" : "Registrar Entrega"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => {
          setFormDialog(false);
          setSelected(null);
        }}
        footer={
          <FormActionButtons
            formId="delivery-form"
            isUpdate={!!selected?.id}
            onCancel={() => {
              setFormDialog(false);
              setSelected(null);
            }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <DeliveryForm
          delivery={selected}
          onSave={handleSave}
          formId="delivery-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      <Menu
        model={
          actionItem
            ? [
                {
                  label: "Ver detalle",
                  icon: "pi pi-eye",
                  command: () => editItem(actionItem),
                },
              ]
            : []
        }
        popup
        ref={menuRef}
        id="delivery-menu"
      />
    </motion.div>
  );
}
