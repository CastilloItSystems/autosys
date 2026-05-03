"use client";

import React, { useMemo, useRef, useState } from "react";
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
import FormActionButtons from "@/shared/components/FormActionButtons";
import dealerTestDriveService from "../services/dealerTestDriveService";
import type { DealerTestDrive } from "../interfaces/dealerTestDrive.interface";
import { handleFormError } from "@/utils/errorHandlers";
import DealerTestDriveForm from "./DealerTestDriveForm";
import { useDealerTestDrivesData } from "../hooks/useDealerTestDrivesData";
import { useDealerUnitOptionsData } from "@/modules/concesionario/vehicles";
import {
  TEST_DRIVE_STATUS_FILTER_OPTIONS,
  TEST_DRIVE_STATUS_META,
} from "../utils/dealerTestDrive.utils";

export default function DealerTestDriveList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);

  const [selected, setSelected] = useState<DealerTestDrive | null>(null);
  const [actionItem, setActionItem] = useState<DealerTestDrive | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);

  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: rows,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      sortBy: "scheduledAt" as const,
      sortOrder: "desc" as const,
    }),
    [page, rows, searchQuery, statusFilter],
  );
  const { items, total: totalRecords, loading, mutate } =
    useDealerTestDrivesData(params);
  const { unitOptions } = useDealerUnitOptionsData();

  const openNew = () => {
    setSelected(null);
    setFormDialog(true);
  };

  const editItem = (item: DealerTestDrive) => {
    setSelected(item);
    setFormDialog(true);
  };

  const confirmDeleteItem = (item: DealerTestDrive) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await dealerTestDriveService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Prueba de manejo anulada correctamente",
        life: 3000,
      });
      await mutate();
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
        ? "Prueba de manejo actualizada correctamente"
        : "Prueba de manejo creada correctamente",
      life: 3000,
    });
    await mutate();
    setFormDialog(false);
    setSelected(null);
  };

  const getMenuItems = (item: DealerTestDrive | null): MenuItem[] => {
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
        label: "Anular",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => confirmDeleteItem(item),
      },
    ];
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Pruebas de Manejo</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={statusFilter}
          options={TEST_DRIVE_STATUS_FILTER_OPTIONS}
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
            placeholder="Buscar cliente, TM, VIN o unidad"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
          />
        </span>
        <CreateButton
          label="Nueva prueba de manejo"
          onClick={openNew}
          tooltip="Crear prueba de manejo"
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
        emptyMessage="No hay pruebas de manejo registradas"
        sortMode="multiple"
        scrollable
      >
        <Column field="testDriveNumber" header="TM" sortable />
        <Column
          header="Unidad"
          body={(row: DealerTestDrive) =>
            `${
              row.dealerUnit?.code ||
              row.dealerUnit?.vin ||
              row.dealerUnit?.id ||
              "N/A"
            }`
          }
        />
        <Column
          header="Cliente"
          body={(row: DealerTestDrive) =>
            row.customer?.name || row.customerName
          }
          sortable
        />
        <Column
          header="Fecha"
          body={(row: DealerTestDrive) =>
            new Date(row.scheduledAt).toLocaleString()
          }
          sortable
        />
        <Column
          header="Estatus"
          body={(row: DealerTestDrive) => {
            const meta = TEST_DRIVE_STATUS_META[row.status] || {
              label: row.status,
              severity: "secondary" as const,
            };
            return <Tag value={meta.label} severity={meta.severity} />;
          }}
        />
        <Column
          header="Acciones"
          body={(rowData: DealerTestDrive) => (
            <Button
              icon="pi pi-cog"
              rounded
              text
              aria-controls="dealer-test-drive-menu"
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
                <i className="pi pi-send mr-3 text-primary text-3xl" />
                {selected?.id
                  ? "Editar Prueba de Manejo"
                  : "Nueva Prueba de Manejo"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="dealer-test-drive-form"
            isUpdate={!!selected?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <DealerTestDriveForm
          testDrive={selected}
          unitOptions={unitOptions}
          formId="dealer-test-drive-form"
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
        itemName={selected?.testDriveNumber || "esta prueba de manejo"}
        isDeleting={isDeleting}
      />

      <Menu
        model={getMenuItems(actionItem)}
        popup
        ref={menuRef}
        id="dealer-test-drive-menu"
      />
    </div>
  );
}
