"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import reportService from "@/app/api/inventory/reportService";

const ExitsWithoutInvoicePage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);

  useEffect(() => {
    loadData();
  }, [page, rows]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getExitsWithoutInvoice(page, rows);
      setItems(response.data);
      setTotalRecords(response.meta.total);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las salidas sin factura",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: "exitNoteNumber",
      header: "Nro. Nota de Salida",
      sortable: true,
      width: "18%",
    },
    {
      field: "createdDate",
      header: "Fecha",
      sortable: true,
      width: "12%",
      body: (row: any) =>
        row.createdDate
          ? new Date(row.createdDate).toLocaleDateString("es-VE")
          : "—",
    },
    {
      field: "recipientName",
      header: "Destinatario",
      sortable: true,
      width: "18%",
      body: (row: any) => (
        <span className="text-500 text-sm">{row.recipientName || "—"}</span>
      ),
    },
    {
      field: "warehouseName",
      header: "Almacén",
      sortable: true,
      width: "15%",
    },
    {
      field: "itemCount",
      header: "Artículos",
      sortable: true,
      width: "10%",
      body: (row: any) => (
        <span className="font-semibold">{row.itemCount}</span>
      ),
    },
    {
      field: "totalQuantity",
      header: "Cant. Total",
      sortable: true,
      width: "10%",
      body: (row: any) => (
        <span className="font-semibold">{row.totalQuantity?.toFixed(0)}</span>
      ),
    },
    {
      field: "daysWithoutInvoice",
      header: "Días Sin Factura",
      sortable: true,
      width: "14%",
      body: (row: any) => (
        <Tag
          value={`${row.daysWithoutInvoice}d`}
          severity={
            row.daysWithoutInvoice > 30
              ? "danger"
              : row.daysWithoutInvoice > 7
              ? "warning"
              : "info"
          }
        />
      ),
    },
  ];

  return (
    <>
      <Toast ref={toast} />
      <Card title="Salidas sin Factura">
        {loading && items.length === 0 ? (
          <Skeleton height="300px" />
        ) : (
          <ReportsTable
            title="Salidas Sin Factura"
            data={items}
            columns={columns}
            loading={loading}
            totalRecords={totalRecords}
            page={page}
            rows={rows}
            reportType="movements"
            onPageChange={(e) => {
              setPage((e.page ?? 0) + 1);
              setRows(e.rows ?? 20);
            }}
            showDateFilter={false}
            showWarehouseFilter={false}
            showSearchFilter={false}
          />
        )}
      </Card>
    </>
  );
};

export default ExitsWithoutInvoicePage;
