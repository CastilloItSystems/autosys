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
import Link from "next/link";
import CreateButton from "@/components/common/CreateButton";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/shared/components/FormActionButtons";
import dealerQuoteService from "../services/dealerQuoteService";
import type { DealerQuote } from "../interfaces/dealerQuote.interface";
import { handleFormError } from "@/utils/errorHandlers";
import DealerQuoteForm from "./DealerQuoteForm";
import { useDealerQuotesData } from "../hooks/useDealerQuotesData";
import { useDealerUnitOptionsData } from "@/modules/concesionario/vehicles";
import {
  QUOTE_STATUS_FILTER_OPTIONS,
  QUOTE_STATUS_META,
  QUOTE_FISCAL_STATUS_META,
  QUOTE_CURRENCY_SEVERITY,
  formatQuoteAmount,
  formatQuoteCrossRef,
} from "../utils/dealerQuote.utils";
import dynamic from "next/dynamic";

const DealerQuotePDFPreview = dynamic(() => import("./DealerQuotePDFPreview"), { ssr: false });

export default function DealerQuoteList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);

  const [selected, setSelected] = useState<DealerQuote | null>(null);
  const [actionItem, setActionItem] = useState<DealerQuote | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);

  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfItem, setPdfItem] = useState<DealerQuote | null>(null);

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
    useDealerQuotesData(params);
  const { unitOptions } = useDealerUnitOptionsData();

  const openNew = () => {
    setSelected(null);
    setFormDialog(true);
  };

  const editItem = (item: DealerQuote) => {
    setSelected(item);
    setFormDialog(true);
  };

  const confirmDeleteItem = (item: DealerQuote) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await dealerQuoteService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cotización desactivada correctamente",
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
        ? "Cotización actualizada correctamente"
        : "Cotización creada correctamente",
      life: 3000,
    });
    await mutate();
    setFormDialog(false);
    setSelected(null);
  };

  const getMenuItems = (item: DealerQuote | null): MenuItem[] => {
    if (!item) return [];
    return [
      {
        label: "Imprimir PDF",
        icon: "pi pi-print",
        command: () => setPdfItem(item),
      },
      { separator: true },
      {
        label: "Convertir y Fiscalizar",
        icon: "pi pi-check-circle",
        disabled: item.status !== "APPROVED",
        command: async () => {
          try {
            await dealerQuoteService.convertAndFiscalize(item.id);
            toast.current?.show({
              severity: "success",
              summary: "Éxito",
              detail: "Cotización fiscalizada correctamente",
              life: 3000,
            });
            await mutate();
          } catch (error) {
            handleFormError(error, toast);
          }
        },
      },
      {
        separator: true,
      },
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
        <h4 className="m-0">Cotizaciones de Vehículos</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={statusFilter}
          options={QUOTE_STATUS_FILTER_OPTIONS}
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
            placeholder="Buscar cliente, cotización, VIN o placa"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
          />
        </span>
        <CreateButton
          label="Nueva cotización"
          onClick={openNew}
          tooltip="Crear cotización"
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
        emptyMessage="No hay cotizaciones registradas"
        sortMode="multiple"
        scrollable
      >
        <Column field="quoteNumber" header="Cotización" sortable />
        <Column
          header="Unidad"
          body={(row: DealerQuote) =>
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
          body={(row: DealerQuote) => row.customer?.name || row.customerName}
          sortable
        />
        <Column
          header="Estatus"
          body={(row: DealerQuote) => {
            const meta = QUOTE_STATUS_META[row.status] || {
              label: row.status,
              severity: "secondary" as const,
            };
            return <Tag value={meta.label} severity={meta.severity} />;
          }}
        />
        <Column
          header="Estatus Fiscal"
          body={(row: DealerQuote) => {
            const meta = QUOTE_FISCAL_STATUS_META[row.fiscalStatus] || {
              label: row.fiscalStatus || "N/A",
              severity: "secondary" as const,
            };
            return <Tag value={meta.label} severity={meta.severity} />;
          }}
        />
        <Column
          header="Moneda"
          body={(row: DealerQuote) => (
            <Tag
              value={row.currency || "USD"}
              severity={QUOTE_CURRENCY_SEVERITY[row.currency] || "secondary"}
            />
          )}
          style={{ width: "7rem" }}
        />
        <Column
          header="Total"
          body={(row: DealerQuote) => {
            const crossRef = formatQuoteCrossRef(
              row.totalAmount,
              row.currency,
              row.exchangeRate,
            );
            return (
              <div>
                <div>
                  {formatQuoteAmount(row.totalAmount, row.currency || "USD")}
      {/* PDF Preview Dialog */}
      {pdfItem && (
        <Dialog
          visible
          onHide={() => setPdfItem(null)}
          header="Vista Previa — Cotización de Vehículo"
          style={{ width: "85%", height: "90vh" }}
          contentStyle={{ padding: 0, height: "100%" }}
          modal
        >
          <DealerQuotePDFPreview data={pdfItem} />
        </Dialog>
      )}
    </div>
                {crossRef && <small className="text-500">{crossRef}</small>}
              </div>
            );
          }}
        />
        <Column
          header="Order"
          body={(row: DealerQuote) =>
            row.salesOrderId ? (
              <Link href={`/empresa/ventas?orderId=${row.salesOrderId}`}>
                Ver
              </Link>
            ) : (
              "-"
            )
          }
        />
        <Column
          header="Pre-Factura"
          body={(row: DealerQuote) =>
            row.preInvoiceId ? (
              <Link
                href={`/empresa/inventario/pre-invoice?preInvoiceId=${row.preInvoiceId}`}
              >
                Ver
              </Link>
            ) : (
              "-"
            )
          }
        />
        <Column
          header="Vigencia"
          body={(row: DealerQuote) =>
            row.validUntil ? new Date(row.validUntil).toLocaleDateString() : "-"
          }
        />
        <Column
          header="Acciones"
          body={(rowData: DealerQuote) => (
            <Button
              icon="pi pi-cog"
              rounded
              text
              aria-controls="dealer-quote-menu"
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
                <i className="pi pi-file-edit mr-3 text-primary text-3xl" />
                {selected?.id ? "Editar Cotización" : "Nueva Cotización"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="dealer-quote-form"
            isUpdate={!!selected?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <DealerQuoteForm
          quote={selected}
          unitOptions={unitOptions}
          formId="dealer-quote-form"
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
        itemName={selected?.quoteNumber || "esta cotización"}
        isDeleting={isDeleting}
      />

      <Menu
        model={getMenuItems(actionItem)}
        popup
        ref={menuRef}
        id="dealer-quote-menu"
      />
    </div>
  );
}
