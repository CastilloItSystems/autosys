import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import PdfDocumentHeader from "@/components/pdf/PdfDocumentHeader";
import PdfDocumentFooter from "@/components/pdf/PdfDocumentFooter";
import type { PdfCompanyInfo } from "@/components/pdf/pdfCompany";
import "@/utils/pdfUtils";

// Fila de stock tal como la devuelve el export (format: json) del backend.
export interface StockExportRow {
  sku?: string;
  itemName?: string;
  category?: string;
  warehouseCode?: string;
  warehouseName?: string;
  quantityReal?: number;
  quantityReserved?: number;
  quantityAvailable?: number;
  averageCost?: number;
  location?: string;
  lastMovementAt?: string;
}

type Align = "left" | "center" | "right";

interface ColumnDef {
  key: keyof StockExportRow;
  header: string;
  width: string;
  align?: Align;
  kind?: "number" | "currency" | "text";
}

// Columnas del listado (landscape). Anchos suman 100%.
const COLUMNS: ColumnDef[] = [
  { key: "sku", header: "SKU", width: "10%" },
  { key: "itemName", header: "Artículo", width: "23%" },
  { key: "category", header: "Categoría", width: "13%" },
  { key: "warehouseName", header: "Almacén", width: "15%" },
  { key: "location", header: "Ubicación", width: "9%" },
  {
    key: "quantityReal",
    header: "Real",
    width: "8%",
    align: "right",
    kind: "number",
  },
  {
    key: "quantityReserved",
    header: "Reserv.",
    width: "8%",
    align: "right",
    kind: "number",
  },
  {
    key: "quantityAvailable",
    header: "Disp.",
    width: "7%",
    align: "right",
    kind: "number",
  },
  {
    key: "averageCost",
    header: "Costo Prom.",
    width: "7%",
    align: "right",
    kind: "currency",
  },
];

const styles = StyleSheet.create({
  page: {
    paddingTop: 86,
    paddingBottom: 50,
    paddingHorizontal: 30,
    fontFamily: "Roboto",
    fontSize: 8,
    color: "#1e293b",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metaText: { fontSize: 7.5, color: "#64748b" },
  metaStrong: { fontFamily: "Roboto-Bold", color: "#1e3a8a" },
  note: {
    fontSize: 7.5,
    color: "#92400e",
    backgroundColor: "#fef3c7",
    padding: 4,
    borderRadius: 3,
    marginBottom: 6,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a8a",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontFamily: "Roboto-Bold",
    fontSize: 7.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 3.5,
    paddingHorizontal: 6,
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  tableCell: { fontSize: 7.5, color: "#334155" },
  emptyBox: {
    marginTop: 24,
    padding: 16,
    textAlign: "center",
    color: "#64748b",
    fontSize: 9,
  },
});

const formatNumber = (value?: number) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toLocaleString("es-VE") : "0";
};

const formatCurrency = (value?: number) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n)
    ? n.toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0,00";
};

const renderCell = (row: StockExportRow, col: ColumnDef) => {
  const raw = row[col.key];
  if (col.kind === "number") return formatNumber(raw as number);
  if (col.kind === "currency") return formatCurrency(raw as number);
  const text = raw === undefined || raw === null || raw === "" ? "—" : String(raw);
  return text;
};

interface Props {
  rows: StockExportRow[];
  company?: PdfCompanyInfo;
  generatedAt?: string;
  filtersSummary?: string;
  note?: string;
}

const StockExportTemplate = ({
  rows,
  company,
  generatedAt,
  filtersSummary,
  note,
}: Props) => (
  <Document title="Reporte de Stock">
    <Page size="A4" orientation="landscape" style={styles.page}>
      <PdfDocumentHeader
        company={company}
        title="Reporte de Stock"
        date={generatedAt}
      />

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          Filtros:{" "}
          <Text style={styles.metaStrong}>{filtersSummary || "Todos"}</Text>
        </Text>
        <Text style={styles.metaText}>
          Total de registros:{" "}
          <Text style={styles.metaStrong}>{formatNumber(rows.length)}</Text>
        </Text>
      </View>

      {note ? <Text style={styles.note}>{note}</Text> : null}

      {rows.length === 0 ? (
        <Text style={styles.emptyBox}>
          No hay registros de stock para los filtros seleccionados.
        </Text>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            {COLUMNS.map((col) => (
              <Text
                key={col.key}
                style={[
                  styles.tableHeaderCell,
                  { width: col.width, textAlign: col.align ?? "left" },
                ]}
              >
                {col.header}
              </Text>
            ))}
          </View>
          {rows.map((row, idx) => (
            <View
              key={`${row.sku ?? "row"}-${row.warehouseCode ?? ""}-${idx}`}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
              wrap={false}
            >
              {COLUMNS.map((col) => (
                <Text
                  key={col.key}
                  style={[
                    styles.tableCell,
                    { width: col.width, textAlign: col.align ?? "left" },
                  ]}
                >
                  {renderCell(row, col)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}

      <PdfDocumentFooter
        companyName={company?.name}
        documentNumber="Reporte de Stock"
      />
    </Page>
  </Document>
);

export default StockExportTemplate;
