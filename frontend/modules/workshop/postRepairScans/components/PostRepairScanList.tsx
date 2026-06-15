"use client";
import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import postRepairScanService from "../services/postRepairScanService";
import type {
  PostRepairScan,
  PostRepairScanResult,
} from "../interfaces/postRepairScan.interface";
import PostRepairScanForm from "./PostRepairScanForm";

const RESULT_COLOR: Record<PostRepairScanResult, string> = {
  PASS: "success",
  FAIL: "danger",
  WITH_OBSERVATIONS: "warning",
};
const RESULT_LABEL: Record<PostRepairScanResult, string> = {
  PASS: "Aprobado",
  FAIL: "Fallido",
  WITH_OBSERVATIONS: "Con observaciones",
};

export default function PostRepairScanList() {
  const [items, setItems] = useState<PostRepairScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [formDialog, setFormDialog] = useState(false);
  const toast = useRef<Toast>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await postRepairScanService.getAll({
        page: page + 1,
        limit: rows,
      });
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

  const resultBody = (s: PostRepairScan) => (
    <Tag value={RESULT_LABEL[s.result]} severity={RESULT_COLOR[s.result] as any} />
  );

  const printedBody = (s: PostRepairScan) =>
    s.reportPrinted ? (
      <Tag value="Impreso" severity="success" />
    ) : (
      <Tag value="Solo digital" severity="warning" />
    );

  return (
    <div className="card">
      <Toast ref={toast} />
      <div className="flex justify-content-between mb-3">
        <h3 className="m-0">Escaneo Post-Reparación</h3>
        <Button
          label="Nuevo Escaneo"
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
        emptyMessage="Sin escaneos registrados"
      >
        <Column field="serviceOrder.folio" header="OT" />
        <Column field="technicianName" header="Técnico" />
        <Column header="Resultado" body={resultBody} />
        <Column header="Reporte" body={printedBody} />
        <Column
          field="performedAt"
          header="Fecha"
          body={(s) => new Date(s.performedAt).toLocaleString()}
        />
      </DataTable>

      <Dialog
        header="Nuevo Escaneo Post-Reparación"
        visible={formDialog}
        onHide={() => setFormDialog(false)}
        style={{ width: "640px" }}
        modal
      >
        <PostRepairScanForm
          onSaved={() => {
            setFormDialog(false);
            fetchData();
            toast.current?.show({
              severity: "success",
              summary: "Escaneo registrado",
              life: 2500,
            });
          }}
        />
      </Dialog>
    </div>
  );
}
