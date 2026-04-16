"use client";

import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import CreateButton from "@/components/common/CreateButton";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import dealerTradeInService from "@/app/api/dealer/dealerTradeInService";
import type { DealerTradeIn } from "@/libs/interfaces/dealer/dealerTradeIn.interface";
import { handleFormError } from "@/utils/errorHandlers";
import DealerTradeInForm from "./DealerTradeInForm";

const STATUS_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Inspeccionada", value: "INSPECTED" },
  { label: "Valorada", value: "VALUED" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
  { label: "Aplicada", value: "APPLIED" },
];

const STATUS_META: Record<
  string,
  { label: string; severity: "success" | "warning" | "danger" | "info" | "secondary" }
> = {
  PENDING: { label: "Pendiente", severity: "warning" },
  INSPECTED: { label: "Inspeccionada", severity: "info" },
  VALUED: { label: "Valorada", severity: "info" },
  APPROVED: { label: "Aprobada", severity: "success" },
  REJECTED: { label: "Rechazada", severity: "danger" },
  APPLIED: { label: "Aplicada", severity: "success" },
};

export default function DealerTradeInList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);

  const [items, setItems] = useState<DealerTradeIn[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<DealerTradeIn | null>(null);
  const [actionItem, setActionItem] = useState<DealerTradeIn | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);

  const [loading, setLoading] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, [page, rows, searchQuery, statusFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await dealerTradeInService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      });
      setItems((res.data || []) as DealerTradeIn[]);
      setTotalRecords(res.meta?.total || 0);
    } catch (error) {
      handleFormError(error, toast);
      setItems([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setSelected(null);
    setFormDialog(true);
  };

  const editItem = (item: DealerTradeIn) => {
    setSelected(item);
    setFormDialog(true);
  };

  const confirmDeleteItem = (item: DealerTradeIn) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await dealerTradeInService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Retoma desactivada correctamente",
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

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selected?.id ? "Retoma actualizada correctamente" : "Retoma creada correctamente",
      life: 3000,
    });
    await loadItems();
    setFormDialog(false);
    setSelected(null);
  };

  const getMenuItems = (item: DealerTradeIn | null): MenuItem[] => {
    if (!item) return [];
    return [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => editItem(item),
      },
      {
        separator: true,
      },
      {
        label: "Desactivar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => confirmDeleteItem(item),
      },
    ];
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Retomas / Avalúos</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(e) => {
            setStatusFilter(e.value || "");
            setPage(0);
          }}
          placeholder="Estatus"
          style={{ minWidth: "170px" }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar cliente o unidad"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
          />
        </span>
        <CreateButton label="Nueva retoma" onClick={openNew} tooltip="Crear retoma" />
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <DataTable
        value={items}
        paginator
        lazy
        first={page * rows}
        rows={rows}
        totalRecords={totalRecords}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPage={(e) => {
          setPage(e.page ?? Math.floor((e.first ?? 0) / (e.rows ?? 10)));
          setRows(e.rows ?? 10);
        }}
        dataKey="id"
        loading={loading}
        header={header}
        emptyMessage="No se encontraron retomas"
        sortMode="multiple"
        scrollable
      >
        <Column field="tradeInNumber" header="Retoma" sortable />
        <Column field="customerName" header="Cliente" sortable />
        <Column field="vehicleBrand" header="Marca" />
        <Column field="vehicleModel" header="Modelo" />
        <Column
          header="Estatus"
          body={(row: DealerTradeIn) => {
            const meta = STATUS_META[row.status] || {
              label: row.status,
              severity: "secondary" as const,
            };
            return <Tag value={meta.label} severity={meta.severity} />;
          }}
        />
        <Column
          header="Acciones"
          body={(rowData: DealerTradeIn) => (
            <Button
              icon="pi pi-cog"
              rounded
              text
              aria-controls="dealer-trade-in-menu"
              aria-haspopup
              onClick={(e) => {
                setActionItem(rowData);
                menuRef.current?.toggle(e);
              }}
              tooltip="Opciones"
              tooltipOptions={{ position: "left" }}
            />
          )}
          exportable={false}
          frozen={true}
          alignFrozen="right"
          style={{ width: "6rem", textAlign: "center" }}
          headerStyle={{ textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        visible={formDialog}
        onHide={() => setFormDialog(false)}
        modal
        maximizable
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-refresh mr-3 text-primary text-3xl" />
                {selected?.id ? "Editar Retoma" : "Nueva Retoma"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="dealer-trade-in-form"
            isUpdate={!!selected?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <DealerTradeInForm
          tradeIn={selected}
          formId="dealer-trade-in-form"
          onSave={handleSave}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setSelected(null);
        }}
        onConfirm={handleDelete}
        itemName={selected?.tradeInNumber || "esta retoma"}
        isDeleting={isDeleting}
      />

      <Menu
        model={getMenuItems(actionItem)}
        popup
        ref={menuRef}
        id="dealer-trade-in-menu"
      />
    </div>
  );
}
