"use client";
import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import roadTestService from "../services/roadTestService";
import type { RoadTest, RoadTestStatus } from "../interfaces/roadTest.interface";
import RoadTestForm from "./RoadTestForm";
import RoadTestActions from "./RoadTestActions";

const STATUS_COLORS: Record<RoadTestStatus, string> = {
  DRAFT: "secondary",
  AUTHORIZED: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  FAILED: "danger",
  CANCELLED: "contrast",
};

const STATUS_LABELS: Record<RoadTestStatus, string> = {
  DRAFT: "Borrador",
  AUTHORIZED: "Autorizada",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Completada",
  FAILED: "Fallida",
  CANCELLED: "Cancelada",
};

export default function RoadTestList() {
  const [items, setItems] = useState<RoadTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [formDialog, setFormDialog] = useState(false);
  const [actionsDialog, setActionsDialog] = useState<RoadTest | null>(null);
  const toast = useRef<Toast>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await roadTestService.getAll({ page: page + 1, limit: rows });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      handleFormError(e, toast);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rows]);

  const statusBody = (rt: RoadTest) => (
    <Tag value={STATUS_LABELS[rt.status]} severity={STATUS_COLORS[rt.status] as any} />
  );

  const actionsBody = (rt: RoadTest) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-cog"
        rounded
        text
        size="small"
        tooltip="Gestionar"
        onClick={() => setActionsDialog(rt)}
      />
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <div className="flex justify-content-between mb-3">
        <h3 className="m-0">Pruebas de Carretera</h3>
        <Button
          label="Nueva Prueba"
          icon="pi pi-plus"
          onClick={() => setFormDialog(true)}
        />
      </div>

      <DataTable
        value={items}
        loading={loading}
        lazy
        paginator
        first={page * rows}
        rows={rows}
        totalRecords={total}
        onPage={(e) => {
          setPage(e.page ?? 0);
          setRows(e.rows ?? 20);
        }}
        emptyMessage="Sin pruebas registradas"
      >
        <Column field="serviceOrder.folio" header="OT" />
        <Column field="motive" header="Motivo" />
        <Column field="driverName" header="Chófer" />
        <Column field="status" header="Estado" body={statusBody} />
        <Column field="kmDeparture" header="Km Salida" />
        <Column field="kmReturn" header="Km Retorno" />
        <Column header="" body={actionsBody} style={{ width: "5rem" }} />
      </DataTable>

      <Dialog
        header="Nueva Prueba de Carretera"
        visible={formDialog}
        onHide={() => setFormDialog(false)}
        style={{ width: "640px" }}
        modal
      >
        <RoadTestForm
          onSaved={() => {
            setFormDialog(false);
            fetchData();
            toast.current?.show({
              severity: "success",
              summary: "Creada",
              detail: "Prueba registrada en estado DRAFT",
              life: 3000,
            });
          }}
        />
      </Dialog>

      <Dialog
        header={`Gestionar prueba — ${actionsDialog?.motive ?? ""}`}
        visible={!!actionsDialog}
        onHide={() => setActionsDialog(null)}
        style={{ width: "720px" }}
        modal
      >
        {actionsDialog && (
          <RoadTestActions
            roadTest={actionsDialog}
            onChanged={() => {
              fetchData();
              roadTestService
                .getById(actionsDialog.id)
                .then((rt) => setActionsDialog(rt))
                .catch(() => null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
