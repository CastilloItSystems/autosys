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
import { workshopOperationService } from "@/app/api/workshop";
import type {
  WorkshopOperation,
  OperationDifficulty,
} from "@/libs/interfaces/workshop";
import { DIFFICULTY_OPTIONS } from "@/libs/zods/workshop/workshopOperationZod";
import WorkshopOperationForm from "./WorkshopOperationForm";

const DIFFICULTY_SEVERITY: Record<
  OperationDifficulty,
  "success" | "info" | "warning" | "danger"
> = {
  BASIC: "success",
  STANDARD: "info",
  ADVANCED: "warning",
  SPECIALIST: "danger",
};

const DIFFICULTY_LABEL: Record<OperationDifficulty, string> = {
  BASIC: "Básica",
  STANDARD: "Estándar",
  ADVANCED: "Avanzada",
  SPECIALIST: "Especialista",
};

export default function WorkshopOperationList() {
  const [items, setItems] = useState<WorkshopOperation[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<WorkshopOperation | null>(null);
  const [actionItem, setActionItem] = useState<WorkshopOperation | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [showActive, setShowActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => {
    loadItems();
  }, [page, rows, searchQuery, showActive, filterDifficulty]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await workshopOperationService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        isActive: showActive ? "true" : undefined,
        difficulty: (filterDifficulty as any) || undefined,
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
    setSelected(null);
    setFormDialog(true);
  };
  const editItem = (item: WorkshopOperation) => {
    setSelected({ ...item });
    setFormDialog(true);
  };
  const confirmDelete = (item: WorkshopOperation) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await workshopOperationService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Operación eliminada",
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

  const handleToggle = async (item: WorkshopOperation) => {
    try {
      await workshopOperationService.toggleActive(item.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Operación ${item.isActive ? "desactivada" : "activada"}`,
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
        detail: selected?.id ? "Operación actualizada" : "Operación creada",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  // ── Body templates ──
  const codeBodyTemplate = (row: WorkshopOperation) => (
    <span className="font-bold text-primary">{row.code}</span>
  );

  const difficultyBodyTemplate = (row: WorkshopOperation) => (
    <Tag
      value={
        DIFFICULTY_LABEL[row.difficulty as OperationDifficulty] ??
        row.difficulty
      }
      severity={
        DIFFICULTY_SEVERITY[row.difficulty as OperationDifficulty] ?? "info"
      }
      rounded
    />
  );

  const specialtyBodyTemplate = (row: WorkshopOperation) =>
    row.requiredSpecialty ? (
      <span className="text-sm">{row.requiredSpecialty.name}</span>
    ) : (
      <span className="text-400">—</span>
    );

  const serviceTypeBodyTemplate = (row: WorkshopOperation) =>
    row.serviceType ? (
      <span
        className="text-xs font-medium px-2 py-1 border-round"
        style={{ background: "var(--blue-50)", color: "var(--blue-700)" }}
      >
        {row.serviceType.name}
      </span>
    ) : (
      <span className="text-400">—</span>
    );

  const minutesBodyTemplate = (row: WorkshopOperation) => {
    if (!row.standardMinutes) return <span className="text-400">—</span>;
    const range =
      row.minMinutes && row.maxMinutes
        ? ` (${row.minMinutes}–${row.maxMinutes})`
        : "";
    return (
      <span>
        {row.standardMinutes} min{range}
      </span>
    );
  };

  const priceBodyTemplate = (row: WorkshopOperation) =>
    new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
    }).format(row.listPrice);

  const materialsBodyTemplate = (row: WorkshopOperation) => {
    const count = row.suggestedMaterials?.length ?? 0;
    return count > 0 ? (
      <Tag
        value={`${count} insumo${count > 1 ? "s" : ""}`}
        severity="secondary"
        rounded
      />
    ) : (
      <span className="text-400">—</span>
    );
  };

  const statusBodyTemplate = (row: WorkshopOperation) => (
    <Tag
      value={row.isActive ? "Activa" : "Inactiva"}
      severity={row.isActive ? "success" : "secondary"}
      rounded
    />
  );

  const actionBodyTemplate = (row: WorkshopOperation) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      aria-haspopup
      onClick={(e) => {
        setActionItem(row);
        menuRef.current?.toggle(e);
      }}
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Operaciones de Taller</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Dropdown
          value={filterDifficulty}
          options={[
            { value: null, label: "Todas las dificultades" },
            ...DIFFICULTY_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
          onChange={(e) => {
            setFilterDifficulty(e.value);
            setPage(0);
          }}
          optionLabel="label"
          optionValue="value"
          placeholder="Dificultad"
          style={{ width: "180px" }}
        />
        <Button
          label={showActive ? "Todas" : "Solo activas"}
          icon={showActive ? "pi pi-filter-slash" : "pi pi-filter"}
          outlined
          size="small"
          onClick={() => {
            setShowActive(!showActive);
            setPage(0);
          }}
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
          label="Nueva operación"
          onClick={openNew}
          tooltip="Crear operación de taller"
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={(e) => {
            setPage(e.page ?? Math.floor(e.first / e.rows));
            setRows(e.rows);
          }}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron operaciones"
          sortMode="multiple"
          scrollable
        >
          <Column
            field="code"
            header="Código"
            sortable
            body={codeBodyTemplate}
            style={{ minWidth: "100px" }}
          />
          <Column
            field="name"
            header="Nombre"
            sortable
            style={{ minWidth: "180px" }}
          />
          <Column
            field="serviceType.name"
            header="Tipo"
            body={serviceTypeBodyTemplate}
            style={{ minWidth: "130px" }}
          />
          <Column
            field="difficulty"
            header="Dificultad"
            body={difficultyBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="requiredSpecialty.name"
            header="Especialidad"
            body={specialtyBodyTemplate}
            style={{ minWidth: "130px" }}
          />
          <Column
            field="standardMinutes"
            header="Tiempos"
            body={minutesBodyTemplate}
            style={{ minWidth: "140px" }}
          />
          <Column
            field="listPrice"
            header="Precio lista"
            body={priceBodyTemplate}
            style={{ minWidth: "130px" }}
          />
          <Column
            header="Insumos"
            body={materialsBodyTemplate}
            style={{ minWidth: "100px" }}
          />
          <Column
            field="isActive"
            header="Estado"
            body={statusBodyTemplate}
            sortable
            style={{ minWidth: "100px" }}
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
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-cog mr-3 text-primary text-3xl" />
                {selected?.id ? "Modificar Operación" : "Crear Operación"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
        footer={
          <FormActionButtons
            formId="workshop-operation-form"
            isUpdate={!!selected?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <WorkshopOperationForm
          operation={selected}
          onSave={handleSave}
          formId="workshop-operation-form"
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
        itemName={selected?.name}
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
        id="workshop-operation-menu"
      />
    </motion.div>
  );
}
