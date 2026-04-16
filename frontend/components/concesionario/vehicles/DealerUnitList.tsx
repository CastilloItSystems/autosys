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
import dealerUnitService from "@/app/api/dealer/dealerUnitService";
import brandsService from "@/app/api/inventory/brandService";
import modelsService from "@/app/api/inventory/modelService";
import type { DealerUnit } from "@/libs/interfaces/dealer/dealerUnit.interface";
import { handleFormError } from "@/utils/errorHandlers";
import DealerUnitForm from "./DealerUnitForm";

const CONDITION_OPTIONS = [
  { label: "Todas las condiciones", value: "" },
  { label: "Nuevo", value: "NEW" },
  { label: "Usado", value: "USED" },
  { label: "Demo", value: "DEMO" },
  { label: "Consignación", value: "CONSIGNMENT" },
];

const STATUS_OPTIONS = [
  { label: "Todos los estados", value: "" },
  { label: "Disponible", value: "AVAILABLE" },
  { label: "Reservado", value: "RESERVED" },
  { label: "En Documentación", value: "IN_DOCUMENTATION" },
  { label: "Facturado", value: "INVOICED" },
  { label: "Lista para Entrega", value: "READY_FOR_DELIVERY" },
  { label: "Entregado", value: "DELIVERED" },
  { label: "Bloqueado", value: "BLOCKED" },
];

const STATUS_META: Record<
  string,
  { label: string; severity: "success" | "warning" | "info" | "danger" | "secondary" }
> = {
  AVAILABLE: { label: "Disponible", severity: "success" },
  RESERVED: { label: "Reservado", severity: "warning" },
  IN_DOCUMENTATION: { label: "En Documentación", severity: "info" },
  INVOICED: { label: "Facturado", severity: "info" },
  READY_FOR_DELIVERY: { label: "Lista para Entrega", severity: "success" },
  DELIVERED: { label: "Entregado", severity: "success" },
  BLOCKED: { label: "Bloqueado", severity: "danger" },
};

const CONDITION_META: Record<
  string,
  { label: string; severity: "success" | "warning" | "info" | "danger" | "secondary" }
> = {
  NEW: { label: "Nuevo", severity: "success" },
  USED: { label: "Usado", severity: "warning" },
  DEMO: { label: "Demo", severity: "info" },
  CONSIGNMENT: { label: "Consignación", severity: "danger" },
};

export default function DealerUnitList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);

  const [items, setItems] = useState<DealerUnit[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<DealerUnit | null>(null);
  const [actionItem, setActionItem] = useState<DealerUnit | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [conditionFilter, setConditionFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);

  const [brandOptions, setBrandOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [modelOptions, setModelOptions] = useState<Array<{ label: string; value: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    loadItems();
  }, [page, rows, searchQuery, brandFilter, conditionFilter, statusFilter]);

  const loadCatalogs = async () => {
    try {
      const [brandsRes, modelsRes] = await Promise.all([
        brandsService.getActive("VEHICLE"),
        modelsService.getActive("VEHICLE"),
      ]);

      const brands = Array.isArray(brandsRes.data) ? brandsRes.data : [];
      const models = Array.isArray(modelsRes.data) ? modelsRes.data : [];

      setBrandOptions(
        brands.map((b) => ({
          label: `${b.code} - ${b.name}`,
          value: b.id,
        })),
      );
      setModelOptions(
        models.map((m) => ({
          label: `${m.name}${m.year ? ` (${m.year})` : ""}`,
          value: m.id,
        })),
      );
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await dealerUnitService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        brandId: brandFilter || undefined,
        condition: conditionFilter || undefined,
        status: statusFilter || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
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

  const editItem = (item: DealerUnit) => {
    setSelected(item);
    setFormDialog(true);
  };

  const confirmDeleteItem = (item: DealerUnit) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await dealerUnitService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Unidad desactivada correctamente",
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
        ? "Unidad actualizada correctamente"
        : "Unidad creada correctamente",
      life: 3000,
    });
    await loadItems();
    setFormDialog(false);
    setSelected(null);
  };

  const getMenuItems = (item: DealerUnit | null): MenuItem[] => {
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
        <h4 className="m-0">Unidades Comerciales</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={brandFilter}
          options={[{ label: "Todas las marcas", value: "" }, ...brandOptions]}
          onChange={(e) => {
            setBrandFilter(e.value || "");
            setPage(0);
          }}
          placeholder="Marca"
          style={{ minWidth: "170px" }}
        />
        <Dropdown
          value={conditionFilter}
          options={CONDITION_OPTIONS}
          onChange={(e) => {
            setConditionFilter(e.value || "");
            setPage(0);
          }}
          placeholder="Condición"
          style={{ minWidth: "160px" }}
        />
        <Dropdown
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(e) => {
            setStatusFilter(e.value || "");
            setPage(0);
          }}
          placeholder="Estado"
          style={{ minWidth: "170px" }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar VIN, código o marca"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
          />
        </span>
        <CreateButton label="Nueva unidad" onClick={openNew} tooltip="Crear unidad" />
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
        emptyMessage="No hay unidades para mostrar"
        sortMode="multiple"
        scrollable
      >
        <Column field="code" header="Código" sortable />
        <Column
          header="Unidad"
          body={(row: DealerUnit) => (
            <div>
              <div className="font-medium">{row.brand?.name}</div>
              <div className="text-600 text-sm">
                {row.model?.name || row.version || "Sin modelo"}
                {row.year ? ` · ${row.year}` : ""}
              </div>
            </div>
          )}
        />
        <Column field="vin" header="VIN" sortable />
        <Column field="plate" header="Placa" />
        <Column
          header="Condición"
          body={(row: DealerUnit) => {
            const meta = CONDITION_META[row.condition] || {
              label: row.condition,
              severity: "secondary" as const,
            };
            return <Tag value={meta.label} severity={meta.severity} />;
          }}
        />
        <Column
          header="Estado"
          body={(row: DealerUnit) => {
            const meta = STATUS_META[row.status] || {
              label: row.status,
              severity: "secondary" as const,
            };
            return <Tag value={meta.label} severity={meta.severity} />;
          }}
        />
        <Column
          header="Precio Lista"
          body={(row: DealerUnit) =>
            row.listPrice != null ? Number(row.listPrice).toLocaleString("es-VE") : "-"
          }
        />
        <Column
          header="Acciones"
          body={(rowData: DealerUnit) => (
            <Button
              icon="pi pi-cog"
              rounded
              text
              aria-controls="dealer-unit-menu"
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
                <i className="pi pi-car mr-3 text-primary text-3xl" />
                {selected?.id ? "Editar Unidad" : "Nueva Unidad"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="dealer-unit-form"
            isUpdate={!!selected?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <DealerUnitForm
          unit={selected}
          brandOptions={brandOptions}
          modelOptions={modelOptions}
          formId="dealer-unit-form"
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
        itemName={selected?.code || selected?.vin || "esta unidad"}
        isDeleting={isDeleting}
      />

      <Menu model={getMenuItems(actionItem)} popup ref={menuRef} id="dealer-unit-menu" />
    </div>
  );
}
