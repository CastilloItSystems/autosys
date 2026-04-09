"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import { motion } from "framer-motion";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { checklistService } from "@/app/api/workshop";
import type { ChecklistTemplate, ChecklistCategory } from "@/libs/interfaces/workshop";
import ChecklistTemplateForm from "./ChecklistTemplateForm";

const CATEGORY_LABELS: Record<string, string> = {
  RECEPTION: "Recepción",
  DIAGNOSIS: "Diagnóstico",
  QUALITY_CONTROL: "Control de calidad",
};

const CATEGORY_SEVERITY: Record<string, any> = {
  RECEPTION: "info",
  DIAGNOSIS: "warning",
  QUALITY_CONTROL: "success",
};

const CATEGORY_FILTER_OPTIONS = [
  { label: "Todos", value: null },
  { label: "Recepción", value: "RECEPTION" },
  { label: "Diagnóstico", value: "DIAGNOSIS" },
  { label: "Control de calidad", value: "QUALITY_CONTROL" },
];

export default function ChecklistTemplateList() {
  const [items, setItems] = useState<ChecklistTemplate[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<ChecklistTemplate | null>(null);
  const [actionItem, setActionItem] = useState<ChecklistTemplate | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [showActive, setShowActive] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<ChecklistCategory | null>(null);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => { loadItems(); }, [page, rows, searchQuery, showActive, categoryFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await checklistService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        isActive: showActive ? "true" : undefined,
        category: categoryFilter ?? undefined,
      });
      setItems(res.data);
      
      setTotalRecords(res.meta.total);
    } catch (error) {
      handleFormError(error, toast);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => { setSelected(null); setFormDialog(true); };
  const editItem = (item: ChecklistTemplate) => { setSelected({ ...item }); setFormDialog(true); };
  const confirmDelete = (item: ChecklistTemplate) => { setSelected(item); setDeleteDialog(true); };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await checklistService.delete(selected.id);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Plantilla eliminada", life: 3000 });
      await loadItems();
      setDeleteDialog(false);
      setSelected(null);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async (item: ChecklistTemplate) => {
    try {
      await checklistService.toggleActive(item.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Plantilla ${item.isActive ? "desactivada" : "activada"}`,
        life: 3000,
      });
      await loadItems();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleSave = () => {
    (async () => {
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: selected?.id ? "Plantilla actualizada" : "Plantilla creada",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  const actionBodyTemplate = (rowData: ChecklistTemplate) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      aria-haspopup
      onClick={(e) => { setActionItem(rowData); menuRef.current?.toggle(e); }}
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const statusBodyTemplate = (rowData: ChecklistTemplate) => (
    <Tag value={rowData.isActive ? "Activo" : "Inactivo"} severity={rowData.isActive ? "success" : "secondary"} rounded />
  );

  const codeBodyTemplate = (rowData: ChecklistTemplate) => (
    <span className="font-bold text-primary">{rowData.code}</span>
  );

  const categoryBodyTemplate = (rowData: ChecklistTemplate) => (
    <Tag
      value={CATEGORY_LABELS[rowData.category] ?? rowData.category}
      severity={CATEGORY_SEVERITY[rowData.category] ?? "info"}
      rounded
    />
  );

  const itemsCountBodyTemplate = (rowData: ChecklistTemplate) => (
    <span>{rowData.items?.length ?? 0} ítems</span>
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Plantillas de Checklist</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Dropdown
          value={categoryFilter}
          options={CATEGORY_FILTER_OPTIONS}
          onChange={(e) => { setCategoryFilter(e.value); setPage(0); }}
          optionLabel="label"
          optionValue="value"
          placeholder="Categoría"
          style={{ minWidth: "160px" }}
        />
        <Button
          label={showActive ? "Todos" : "Solo activos"}
          icon={showActive ? "pi pi-filter-slash" : "pi pi-filter"}
          outlined
          size="small"
          onClick={() => { setShowActive(!showActive); setPage(0); }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          />
        </span>
        <CreateButton label="Nueva plantilla" onClick={openNew} tooltip="Crear plantilla de checklist" />
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Toast ref={toast} />
      <div className="card">
        <DataTable
          value={items}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={(e) => { setPage(e.page ?? Math.floor(e.first / e.rows)); setRows(e.rows); }}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron plantillas"
          sortMode="multiple"
          scrollable
        >
          <Column field="code" header="Código" sortable body={codeBodyTemplate} style={{ minWidth: "100px" }} />
          <Column field="name" header="Nombre" sortable style={{ minWidth: "200px" }} />
          <Column field="category" header="Categoría" body={categoryBodyTemplate} sortable style={{ minWidth: "160px" }} />
          <Column field="items" header="Ítems" body={itemsCountBodyTemplate} style={{ minWidth: "100px" }} />
          <Column field="isActive" header="Estado" body={statusBodyTemplate} sortable style={{ minWidth: "100px" }} />
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
        style={{ width: "800px" }}
        breakpoints={{ "960px": "75vw", "640px": "95vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-list-check mr-3 text-primary text-3xl" />
                {selected?.id ? "Modificar Plantilla de Checklist" : "Crear Plantilla de Checklist"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
        footer={
          <FormActionButtons
            formId="checklist-template-form"
            isUpdate={!!selected?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ChecklistTemplateForm
          template={selected}
          onSave={handleSave}
          formId="checklist-template-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => { setDeleteDialog(false); setSelected(null); }}
        onConfirm={handleDelete}
        itemName={selected?.name}
        isDeleting={isDeleting}
      />

      <Menu
        model={
          actionItem
            ? [
                { label: "Editar", icon: "pi pi-pencil", command: () => editItem(actionItem) },
                {
                  label: actionItem.isActive ? "Desactivar" : "Activar",
                  icon: actionItem.isActive ? "pi pi-pause" : "pi pi-play",
                  command: () => handleToggle(actionItem),
                },
                { separator: true },
                {
                  label: "Eliminar",
                  icon: "pi pi-trash",
                  className: "p-menuitem-danger",
                  command: () => confirmDelete(actionItem),
                },
              ]
            : []
        }
        popup
        ref={menuRef}
        id="checklist-template-menu"
      />
    </motion.div>
  );
}
