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
import dealerApprovalService, {
  DealerApproval,
} from "@/app/api/dealer/dealerApprovalService";
import { handleFormError } from "@/utils/errorHandlers";
import DealerApprovalForm from "./DealerApprovalForm";

const TYPE_OPTIONS = [
  { label: "Todos los tipos", value: "" },
  { label: "Excepción de Descuento", value: "DISCOUNT_EXCEPTION" },
  { label: "Aprobación de Retoma", value: "TRADE_IN_APPROVAL" },
  { label: "Override Financiamiento", value: "FINANCING_OVERRIDE" },
  { label: "Excepción Entrega", value: "DELIVERY_EXCEPTION" },
  { label: "Excepción Documental", value: "DOCUMENT_EXCEPTION" },
];

const STATUS_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
  { label: "Cancelada", value: "CANCELLED" },
];

const STATUS_META: Record<
  string,
  { label: string; severity: "success" | "warning" | "danger" | "secondary" }
> = {
  PENDING: { label: "Pendiente", severity: "warning" },
  APPROVED: { label: "Aprobada", severity: "success" },
  REJECTED: { label: "Rechazada", severity: "danger" },
  CANCELLED: { label: "Cancelada", severity: "secondary" },
};

export default function DealerApprovalsList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);

  const [items, setItems] = useState<DealerApproval[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<DealerApproval | null>(null);
  const [actionItem, setActionItem] = useState<DealerApproval | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);

  const [loading, setLoading] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, [page, rows, searchQuery, statusFilter, typeFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await dealerApprovalService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setItems(res.data ?? []);
      setTotalRecords(res.meta?.total ?? 0);
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

  const editItem = (item: DealerApproval) => {
    setSelected(item);
    setFormDialog(true);
  };

  const confirmDeleteItem = (item: DealerApproval) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await dealerApprovalService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Aprobación eliminada correctamente",
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
        ? "Aprobación actualizada correctamente"
        : "Aprobación creada correctamente",
      life: 3000,
    });
    await loadItems();
    setFormDialog(false);
    setSelected(null);
  };

  const getMenuItems = (item: DealerApproval | null): MenuItem[] => {
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
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => confirmDeleteItem(item),
      },
    ];
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Aprobaciones</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(e) => {
            setStatusFilter(e.value);
            setPage(0);
          }}
          placeholder="Estatus"
          style={{ minWidth: "160px" }}
        />
        <Dropdown
          value={typeFilter}
          options={TYPE_OPTIONS}
          onChange={(e) => {
            setTypeFilter(e.value);
            setPage(0);
          }}
          placeholder="Tipo"
          style={{ minWidth: "170px" }}
        />
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
          />
        </span>
        <CreateButton
          label="Nueva aprobación"
          onClick={openNew}
          tooltip="Crear aprobación"
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
        emptyMessage="No se encontraron aprobaciones"
        sortMode="multiple"
        scrollable
      >
        <Column field="approvalNumber" header="Aprobación" sortable />
        <Column field="title" header="Título" sortable />
        <Column field="type" header="Tipo" sortable />
        <Column
          field="status"
          header="Estatus"
          sortable
          body={(rowData: DealerApproval) => {
            const meta = STATUS_META[rowData.status] || {
              label: rowData.status,
              severity: "secondary" as const,
            };
            return <Tag value={meta.label} severity={meta.severity} />;
          }}
        />
        <Column
          header="Acciones"
          body={(rowData: DealerApproval) => (
            <Button
              icon="pi pi-cog"
              rounded
              text
              aria-controls="dealer-approval-menu"
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
                <i className="pi pi-check-square mr-3 text-primary text-3xl" />
                {selected?.id ? "Editar Aprobación" : "Nueva Aprobación"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="dealer-approval-form"
            isUpdate={!!selected?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <DealerApprovalForm
          approval={selected}
          formId="dealer-approval-form"
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
        itemName={selected?.title || selected?.approvalNumber || "esta aprobación"}
        isDeleting={isDeleting}
      />

      <Menu
        model={getMenuItems(actionItem)}
        popup
        ref={menuRef}
        id="dealer-approval-menu"
      />
    </div>
  );
}
