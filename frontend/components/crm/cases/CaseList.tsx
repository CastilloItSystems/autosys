"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DataTable, DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { motion } from "framer-motion";

import caseService from "@/app/api/crm/caseService";
import {
  Case,
  CASE_STATUS_CONFIG,
  CASE_STATUS_OPTIONS,
  CASE_PRIORITY_CONFIG,
  CASE_PRIORITY_OPTIONS,
  CASE_TYPE_CONFIG,
  CASE_TYPE_OPTIONS,
} from "@/libs/interfaces/crm/case.interface";
import CaseForm from "./CaseForm";
import CaseStatusDialog from "./CaseStatusDialog";
import CaseDetailDialog from "./CaseDetailDialog";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/components/common/FormActionButtons";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

const typeFilterOptions = [{ label: "Todos los tipos", value: "" }, ...CASE_TYPE_OPTIONS];
const statusFilterOptions = [{ label: "Todos los estados", value: "" }, ...CASE_STATUS_OPTIONS];
const priorityFilterOptions = [{ label: "Todas las prioridades", value: "" }, ...CASE_PRIORITY_OPTIONS];
const TERMINAL_STATUSES = ["CLOSED", "REJECTED"];

export default function CaseList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);

  const [actionCase, setActionCase] = useState<Case | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editCase, setEditCase] = useState<Case | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusDialogCase, setStatusDialogCase] = useState<Case | null>(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);

  const [detailCaseId, setDetailCaseId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [search, filterType, filterStatus, filterPriority]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await caseService.getAll({
        page: page + 1,
        limit: rows,
        search: search || undefined,
        type: filterType || undefined,
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const raw = (res as any)?.data ?? res;
      setCases(raw.data ?? raw);
      setTotal(raw.meta?.total ?? raw.length ?? 0);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al cargar casos" });
    } finally {
      setLoading(false);
    }
  }, [page, rows, search, filterType, filterStatus, filterPriority]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditCase(null);
    setFormVisible(true);
  };

  const openEdit = (c: Case) => {
    setEditCase(c);
    setFormVisible(true);
  };

  const openStatusDialog = (c: Case) => {
    setStatusDialogCase(c);
    setStatusDialogVisible(true);
  };

  const openDetail = (c: Case) => {
    setDetailCaseId(c.id);
    setDetailVisible(true);
  };

  const confirmDeleteCase = (c: Case) => {
    setSelectedCase(c);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedCase) return;

    setIsDeleting(true);
    try {
      await caseService.delete(selectedCase.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Caso eliminado correctamente",
        life: 3000,
      });
      setDeleteDialog(false);
      setSelectedCase(null);
      await load();
    } catch (e: any) {
      toast.current?.show({
        severity: "error",
        summary: e?.response?.data?.message ?? "Error al eliminar",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: editCase ? "Caso actualizado correctamente" : "Caso creado correctamente",
      life: 3000,
    });
    setFormVisible(false);
    setEditCase(null);
    await load();
  };

  const menuItems = (c: Case): MenuItem[] => [
    { label: "Ver detalle", icon: "pi pi-eye", command: () => openDetail(c) },
    {
      label: "Cambiar Estado",
      icon: "pi pi-exchange",
      command: () => openStatusDialog(c),
      disabled: TERMINAL_STATUSES.includes(c.status as string),
    },
    {
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => openEdit(c),
      disabled: TERMINAL_STATUSES.includes(c.status as string),
    },
    { separator: true },
    {
      label: "Eliminar",
      icon: "pi pi-trash",
      className: "p-menuitem-danger",
      command: () => confirmDeleteCase(c),
      disabled: c.status !== "OPEN",
    },
  ];

  const caseNumberBody = (c: Case) => (
    <div>
      <div className="font-semibold text-sm">{c.caseNumber}</div>
      <div className="text-xs text-600 mt-1">{c.title}</div>
    </div>
  );

  const customerBody = (c: Case) => (
    <div>
      <div className="text-sm">{c.customer?.name ?? c.customerId}</div>
      {c.customer?.code && <div className="text-xs text-500">{c.customer.code}</div>}
    </div>
  );

  const typeBody = (c: Case) => {
    const cfg = CASE_TYPE_CONFIG[c.type];
    if (!cfg) return <span className="text-xs text-500">{c.type}</span>;
    return <span className="text-xs">{cfg.label}</span>;
  };

  const priorityBody = (c: Case) => {
    const cfg = CASE_PRIORITY_CONFIG[c.priority];
    if (!cfg) return <span className="text-xs">{c.priority}</span>;
    return <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" />;
  };

  const statusBody = (c: Case) => {
    const cfg = CASE_STATUS_CONFIG[c.status];
    if (!cfg) return <span className="text-xs">{c.status}</span>;
    return <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" />;
  };

  const slaBody = (c: Case) => {
    if (!c.slaDeadline) return <span className="text-400">—</span>;
    const isOverdue =
      new Date(c.slaDeadline) < new Date() &&
      !TERMINAL_STATUSES.includes(c.status as string) &&
      c.status !== "RESOLVED";
    return (
      <span className={`text-sm ${isOverdue ? "text-red-500 font-semibold" : ""}`}>
        {isOverdue && <i className="pi pi-exclamation-triangle mr-1" />}
        {new Date(c.slaDeadline).toLocaleDateString("es-VE")}
      </span>
    );
  };

  const createdAtBody = (c: Case) => new Date(c.createdAt).toLocaleDateString("es-VE");

  const actionBodyTemplate = (rowData: Case) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setActionCase(rowData);
        menuRef.current?.toggle(e);
      }}
      aria-controls="case-menu"
      aria-haspopup
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      <Menu model={menuItems(actionCase as Case)} popup ref={menuRef} id="case-menu" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="card">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="mb-1 text-900">Casos / PQRS / Reclamos</h4>
            <span className="text-500 text-sm">{total} registros</span>
          </div>
          <CreateButton label="Nuevo Caso" onClick={openNew} tooltip="Crear nuevo caso o reclamo" />
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar caso..."
              style={{ width: "220px" }}
            />
          </span>
          <Dropdown value={filterType} onChange={(e) => setFilterType(e.value)} options={typeFilterOptions} optionLabel="label" optionValue="value" style={{ minWidth: "180px" }} />
          <Dropdown value={filterPriority} onChange={(e) => setFilterPriority(e.value)} options={priorityFilterOptions} optionLabel="label" optionValue="value" style={{ minWidth: "160px" }} />
          <Dropdown value={filterStatus} onChange={(e) => setFilterStatus(e.value)} options={statusFilterOptions} optionLabel="label" optionValue="value" style={{ minWidth: "180px" }} />
        </div>

        <DataTable
          value={cases}
          loading={loading}
          lazy
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={total}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={(e: DataTableStateEvent) => {
            setPage(e.page ?? 0);
            setRows(e.rows ?? 20);
          }}
          emptyMessage="No se encontraron casos"
          sortMode="multiple"
          scrollable
          dataKey="id"
          tableStyle={{ minWidth: "70rem" }}
        >
          <Column header="Caso" body={caseNumberBody} style={{ minWidth: "200px" }} />
          <Column header="Cliente" body={customerBody} style={{ minWidth: "160px" }} />
          <Column header="Tipo" body={typeBody} style={{ minWidth: "140px" }} />
          <Column header="Prioridad" body={priorityBody} style={{ width: "110px" }} />
          <Column header="Estado" body={statusBody} style={{ width: "150px" }} />
          <Column header="SLA" body={slaBody} style={{ width: "120px" }} />
          <Column header="Creado" body={createdAtBody} style={{ width: "110px" }} />
          <Column
            header="Acciones"
            body={actionBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "6rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </motion.div>

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setSelectedCase(null);
        }}
        onConfirm={handleDelete}
        itemName={selectedCase ? `${selectedCase.caseNumber} — ${selectedCase.title}` : "caso"}
        isDeleting={isDeleting}
      />

      <Dialog
        visible={formVisible}
        onHide={() => {
          setFormVisible(false);
          setEditCase(null);
        }}
        modal
        maximizable
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-inbox mr-3 text-primary text-3xl"></i>
                {editCase ? `Editar Caso · ${editCase.caseNumber}` : "Nuevo Caso / PQRS"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="case-form"
            isUpdate={!!editCase?.id}
            onCancel={() => {
              setFormVisible(false);
              setEditCase(null);
            }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <CaseForm
          caseRecord={editCase}
          formId="case-form"
          onSave={handleSave}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      <CaseStatusDialog
        caseRecord={statusDialogCase}
        visible={statusDialogVisible}
        onHide={() => setStatusDialogVisible(false)}
        onSaved={load}
        toast={toast}
      />

      <CaseDetailDialog
        caseId={detailCaseId}
        visible={detailVisible}
        onHide={() => setDetailVisible(false)}
        onUpdated={load}
        toast={toast}
      />
    </>
  );
}
