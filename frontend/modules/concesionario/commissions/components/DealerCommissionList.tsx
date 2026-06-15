"use client";

import React, { useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import FormActionButtons from "@/shared/components/FormActionButtons";
import type { DealerCommission } from "../interfaces/dealerCommission.interface";
import DealerCommissionForm from "./DealerCommissionForm";
import { useDealerCommissionsData } from "../hooks/useDealerCommissionsData";
import {
  COMMISSION_STATUS_FILTER_OPTIONS,
  COMMISSION_STATUS_META,
  formatCommissionAmount,
  formatCommissionPct,
} from "../utils/dealerCommission.utils";

export default function DealerCommissionList() {
  const toast = useRef<Toast>(null);

  const [selected, setSelected] = useState<DealerCommission | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [formDialog, setFormDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: rows,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
    }),
    [page, rows, searchQuery, statusFilter],
  );

  const { items, total: totalRecords, loading, mutate } =
    useDealerCommissionsData(params);

  const editItem = (item: DealerCommission) => {
    setSelected(item);
    setFormDialog(true);
  };

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Comisión actualizada correctamente",
      life: 3000,
    });
    await mutate();
    setFormDialog(false);
    setSelected(null);
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Comisiones Comerciales</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={statusFilter}
          options={COMMISSION_STATUS_FILTER_OPTIONS}
          onChange={(e) => {
            setStatusFilter(e.value || "");
            setPage(0);
          }}
          placeholder="Estatus"
          style={{ minWidth: "160px" }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar asesor o cotización"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
          />
        </span>
        <Button
          icon="pi pi-refresh"
          rounded
          text
          onClick={() => mutate()}
          tooltip="Refrescar"
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
        emptyMessage="No hay comisiones registradas"
        scrollable
      >
        <Column
          header="Cotización"
          body={(row: DealerCommission) => row.dealerQuote?.quoteNumber || "-"}
        />
        <Column
          header="Cliente"
          body={(row: DealerCommission) => row.dealerQuote?.customerName || "-"}
        />
        <Column
          header="Asesor"
          body={(row: DealerCommission) => row.sellerName || row.sellerId || "-"}
        />
        <Column
          header="Base"
          body={(row: DealerCommission) =>
            formatCommissionAmount(row.baseAmount, row.currency || "USD")
          }
        />
        <Column
          header="%"
          body={(row: DealerCommission) => formatCommissionPct(row.commissionPct)}
          style={{ width: "6rem" }}
        />
        <Column
          header="Comisión"
          body={(row: DealerCommission) =>
            formatCommissionAmount(row.commissionAmount, row.currency || "USD")
          }
        />
        <Column
          header="Estatus"
          body={(row: DealerCommission) => {
            const meta = COMMISSION_STATUS_META[row.status] || {
              label: row.status,
              severity: "secondary" as const,
            };
            return <Tag value={meta.label} severity={meta.severity} />;
          }}
        />
        <Column
          header="Creada"
          body={(row: DealerCommission) =>
            row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"
          }
        />
        <Column
          header="Acciones"
          body={(row: DealerCommission) => (
            <Button
              icon="pi pi-pencil"
              rounded
              text
              onClick={() => editItem(row)}
              tooltip="Gestionar comisión"
              tooltipOptions={{ position: "left" }}
            />
          )}
          exportable={false}
          frozen
          alignFrozen="right"
          style={{ width: "6rem", textAlign: "center" }}
          headerStyle={{ textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        visible={formDialog}
        onHide={() => setFormDialog(false)}
        modal
        style={{ width: "40vw" }}
        breakpoints={{ "960px": "75vw", "640px": "95vw" }}
        header={
          <div className="mb-2">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-0 flex align-items-center">
                <i className="pi pi-percentage mr-3 text-primary text-3xl" />
                Gestionar Comisión
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="dealer-commission-form"
            isUpdate
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        {selected && (
          <DealerCommissionForm
            commission={selected}
            formId="dealer-commission-form"
            onSave={handleSave}
            onSubmittingChange={setIsSubmitting}
            toast={toast}
          />
        )}
      </Dialog>
    </div>
  );
}
