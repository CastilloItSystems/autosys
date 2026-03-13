"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import loanService, { Loan } from "@/app/api/inventory/loanService";

interface ReturnRow {
  itemId: string;
  itemName: string;
  itemSku: string;
  quantityLoaned: number;
  quantityReturned: number;
  alreadyReturned: number;
  maxToReturn: number;
  toReturn: number;
}

interface LoanReturnDialogProps {
  visible: boolean;
  loan: Loan;
  onHide: () => void;
  onSuccess: () => void;
  toast: React.RefObject<any>;
}

const LoanReturnDialog = ({
  visible,
  loan,
  onHide,
  onSuccess,
  toast,
}: LoanReturnDialogProps) => {
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ReturnRow[]>(() =>
    (loan.items ?? []).map((i) => ({
      itemId: i.itemId,
      itemName: i.item?.name ?? i.itemId,
      itemSku: i.item?.sku ?? "",
      quantityLoaned: i.quantityLoaned,
      quantityReturned: i.quantityReturned,
      alreadyReturned: i.quantityReturned,
      maxToReturn: i.quantityLoaned - i.quantityReturned,
      toReturn: i.quantityLoaned - i.quantityReturned,
    })),
  );

  const updateToReturn = (itemId: string, value: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.itemId === itemId
          ? { ...r, toReturn: Math.max(0, Math.min(value, r.maxToReturn)) }
          : r,
      ),
    );
  };

  const handleSubmit = async () => {
    const itemsToReturn = rows
      .filter((r) => r.toReturn > 0)
      .map((r) => ({ itemId: r.itemId, quantityReturned: r.toReturn }));

    if (!itemsToReturn.length) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debes indicar al menos un artículo a devolver",
        life: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      await loanService.returnItems(loan.id, { items: itemsToReturn });
      onSuccess();
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err?.response?.data?.message ?? "No se pudo registrar la devolución",
        life: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const qtyTemplate = (row: ReturnRow) => (
    <InputNumber
      value={row.toReturn}
      onValueChange={(e) => updateToReturn(row.itemId, e.value ?? 0)}
      min={0}
      max={row.maxToReturn}
      showButtons
      buttonLayout="horizontal"
      decrementButtonClassName="p-button-secondary p-button-sm"
      incrementButtonClassName="p-button-secondary p-button-sm"
      inputClassName="w-4rem text-center"
      disabled={row.maxToReturn === 0}
    />
  );

  const statusTemplate = (row: ReturnRow) => {
    if (row.maxToReturn === 0)
      return <Tag value="Ya devuelto" severity="success" />;
    if (row.toReturn === row.maxToReturn)
      return <Tag value="Devuelto completo" severity="info" />;
    if (row.toReturn > 0) return <Tag value="Parcial" severity="warning" />;
    return <Tag value="Pendiente" severity="secondary" />;
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        onClick={onHide}
        disabled={saving}
      />
      <Button
        label="Registrar Devolución"
        icon="pi pi-undo"
        severity="info"
        loading={saving}
        onClick={handleSubmit}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-undo text-primary text-2xl" />
          <div>
            <div className="text-xl font-semibold">Registrar Devolución</div>
            <div className="text-sm text-500">
              {loan.loanNumber} — {loan.borrowerName}
            </div>
          </div>
        </div>
      }
      footer={footer}
      modal
      style={{ width: "90vw", maxWidth: "680px" }}
    >
      <p className="text-600 mb-3 mt-0">
        Indica cuántas unidades de cada artículo están siendo devueltas.
      </p>
      <DataTable value={rows} dataKey="itemId" size="small" stripedRows>
        <Column
          header="Artículo"
          style={{ minWidth: "160px" }}
          body={(r: ReturnRow) => (
            <div>
              <div className="font-medium">{r.itemName}</div>
              <small className="text-400">{r.itemSku}</small>
            </div>
          )}
        />
        <Column
          header="Prestado"
          field="quantityLoaned"
          style={{ width: "90px", textAlign: "center" }}
        />
        <Column
          header="Ya devuelto"
          field="alreadyReturned"
          style={{ width: "100px", textAlign: "center" }}
        />
        <Column
          header="Devolver ahora"
          body={qtyTemplate}
          style={{ minWidth: "160px" }}
        />
        <Column header="" body={statusTemplate} style={{ width: "130px" }} />
      </DataTable>
    </Dialog>
  );
};

export default LoanReturnDialog;
