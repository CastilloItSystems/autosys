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
import { workshopShiftService } from "@/app/api/workshop";
import type { WorkshopShift } from "@/libs/interfaces/workshop";
import WorkshopShiftForm from "./WorkshopShiftForm";

const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

export default function WorkshopShiftList() {
  const [items, setItems] = useState<WorkshopShift[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<WorkshopShift | null>(null);
  const [actionItem, setActionItem] = useState<WorkshopShift | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [showActive, setShowActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => { loadItems(); }, [page, rows, searchQuery, showActive]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await workshopShiftService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        isActive: showActive ? "true" : undefined,
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

  const openNew = () => { setSelected(null); setFormDialog(true); };
  const editItem = (item: WorkshopShift) => { setSelected({ ...item }); setFormDialog(true); };

  const handleToggle = async (item: WorkshopShift) => {
    try {
      await workshopShiftService.toggleActive(item.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Turno ${item.isActive ? "desactivado" : "activado"}`,
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
        detail: selected?.id ? "Turno actualizado" : "Turno creado",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  const actionBodyTemplate = (rowData: WorkshopShift) => (
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

  const statusBodyTemplate = (rowData: WorkshopShift) => (
    <Tag value={rowData.isActive ? "Activo" : "Inactivo"} severity={rowData.isActive ? "success" : "secondary"} rounded />
  );

  const codeBodyTemplate = (rowData: WorkshopShift) => (
    <span className="font-bold text-primary">{rowData.code}</span>
  );

  const workDaysBodyTemplate = (rowData: WorkshopShift) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6, 0].map((day) => (
        <span
          key={day}
          className={`text-xs border-circle w-1rem h-1rem flex align-items-center justify-content-center ${
            rowData.workDays.includes(day) ? "bg-primary text-white" : "bg-surface-200 text-500"
          }`}
        >
          {DAY_LABELS[day]}
        </span>
      ))}
    </div>
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Turnos de Trabajo</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2">
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
        <CreateButton label="Nuevo turno" onClick={openNew} tooltip="Crear turno" />
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
          emptyMessage="No se encontraron turnos"
          sortMode="multiple"
          scrollable
        >
          <Column field="code" header="Código" sortable body={codeBodyTemplate} style={{ minWidth: "100px" }} />
          <Column field="name" header="Nombre" sortable style={{ minWidth: "180px" }} />
          <Column field="startTime" header="Inicio" sortable style={{ minWidth: "100px" }} />
          <Column field="endTime" header="Fin" sortable style={{ minWidth: "100px" }} />
          <Column field="workDays" header="Días de trabajo" body={workDaysBodyTemplate} style={{ minWidth: "160px" }} />
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
        style={{ width: "500px" }}
        breakpoints={{ "900px": "65vw", "600px": "90vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-clock mr-3 text-primary text-3xl" />
                {selected?.id ? "Modificar Turno" : "Crear Turno"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
        footer={
          <FormActionButtons
            formId="workshop-shift-form"
            isUpdate={!!selected?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <WorkshopShiftForm
          shift={selected}
          onSave={handleSave}
          formId="workshop-shift-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

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
              ]
            : []
        }
        popup
        ref={menuRef}
        id="workshop-shift-menu"
      />
    </motion.div>
  );
}
