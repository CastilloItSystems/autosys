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
import dealerFinancingService from "@/app/api/dealer/dealerFinancingService";
import dealerUnitService from "@/app/api/dealer/dealerUnitService";
import type { DealerFinancing } from "@/libs/interfaces/dealer/dealerFinancing.interface";
import type { DealerUnit } from "@/libs/interfaces/dealer/dealerUnit.interface";
import { handleFormError } from "@/utils/errorHandlers";
import DealerFinancingForm from "./DealerFinancingForm";

const STATUS_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  { label: "Borrador", value: "DRAFT" },
  { label: "Enviada", value: "SUBMITTED" },
  { label: "En revisión", value: "UNDER_REVIEW" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
  { label: "Cancelada", value: "CANCELLED" },
  { label: "Desembolsada", value: "DISBURSED" },
];

const STATUS_META: Record<
  string,
  { label: string; severity: "success" | "warning" | "danger" | "info" | "secondary" }
> = {
  DRAFT: { label: "Borrador", severity: "warning" },
  SUBMITTED: { label: "Enviada", severity: "info" },
  UNDER_REVIEW: { label: "En revisión", severity: "info" },
  APPROVED: { label: "Aprobada", severity: "success" },
  REJECTED: { label: "Rechazada", severity: "danger" },
  CANCELLED: { label: "Cancelada", severity: "danger" },
  DISBURSED: { label: "Desembolsada", severity: "success" },
};

export default function DealerFinancingList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);

  const [items, setItems] = useState<DealerFinancing[]>([]);
  const [unitOptions, setUnitOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<DealerFinancing | null>(null);
  const [actionItem, setActionItem] = useState<DealerFinancing | null>(null);

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
    loadUnits();
  }, []);

  useEffect(() => {
    loadItems();
  }, [page, rows, searchQuery, statusFilter]);

  const loadUnits = async () => {
    try {
      const res = await dealerUnitService.getAll({
        page: 1,
        limit: 300,
        isActive: "true",
      });
      const units = Array.isArray(res.data) ? (res.data as DealerUnit[]) : [];
      setUnitOptions(
        units.map((u) => ({
          label: `${u.code || u.vin || u.id} - ${u.brand?.name || "Unidad"}`,
          value: u.id,
        })),
      );
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await dealerFinancingService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      });
      setItems((res.data || []) as DealerFinancing[]);
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

  const editItem = (item: DealerFinancing) => {
    setSelected(item);
    setFormDialog(true);
  };

  const confirmDeleteItem = (item: DealerFinancing) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await dealerFinancingService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Financiamiento desactivado correctamente",
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
      detail: selected?.id
        ? "Financiamiento actualizado correctamente"
        : "Financiamiento creado correctamente",
      life: 3000,
    });
    await loadItems();
    setFormDialog(false);
    setSelected(null);
  };

  const getMenuItems = (item: DealerFinancing | null): MenuItem[] => {
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
        <h4 className="m-0">Financiamiento</h4>
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
        <CreateButton
          label="Nuevo financiamiento"
          onClick={openNew}
          tooltip="Crear financiamiento"
        />
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
        emptyMessage="No se encontraron financiamientos"
        sortMode="multiple"
        scrollable
      >
        <Column field="financingNumber" header="Financiamiento" sortable />
        <Column field="customerName" header="Cliente" sortable />
        <Column
          header="Unidad"
          body={(row: DealerFinancing) =>
            row.dealerUnit?.code || row.dealerUnit?.vin || "-"
          }
        />
        <Column
          header="Solicitado"
          body={(row: DealerFinancing) =>
            row.requestedAmount != null ? Number(row.requestedAmount).toFixed(2) : "-"
          }
        />
        <Column
          header="Aprobado"
          body={(row: DealerFinancing) =>
            row.approvedAmount != null ? Number(row.approvedAmount).toFixed(2) : "-"
          }
        />
        <Column
          header="Estatus"
          body={(row: DealerFinancing) => {
            const meta = STATUS_META[row.status] || {
              label: row.status,
              severity: "secondary" as const,
            };
            return <Tag value={meta.label} severity={meta.severity} />;
          }}
        />
        <Column
          header="Acciones"
          body={(rowData: DealerFinancing) => (
            <Button
              icon="pi pi-cog"
              rounded
              text
              aria-controls="dealer-financing-menu"
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
                <i className="pi pi-money-bill mr-3 text-primary text-3xl" />
                {selected?.id ? "Editar Financiamiento" : "Nuevo Financiamiento"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="dealer-financing-form"
            isUpdate={!!selected?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <DealerFinancingForm
          financing={selected}
          unitOptions={unitOptions}
          formId="dealer-financing-form"
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
        itemName={selected?.financingNumber || "este financiamiento"}
        isDeleting={isDeleting}
      />

      <Menu
        model={getMenuItems(actionItem)}
        popup
        ref={menuRef}
        id="dealer-financing-menu"
      />
    </div>
  );
}
