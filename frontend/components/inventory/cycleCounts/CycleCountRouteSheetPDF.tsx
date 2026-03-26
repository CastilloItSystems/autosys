"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import "../../../utils/pdfUtils"; // registrar fuentes Roboto

import { CycleCount, CycleCountItem } from "../../../app/api/inventory/cycleCountService";
import { CYCLE_COUNT_STATUS_CONFIG } from "../../../libs/interfaces/inventory/cycleCount.interface";

// ─── Estilos ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 8,
    padding: 28,
    paddingBottom: 50,
  },
  // Header
  headerBlock: {
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#2563EB",
    paddingBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    gap: 4,
  },
  metaLabel: {
    fontWeight: "bold",
    color: "#6B7280",
  },
  metaValue: {
    color: "#111827",
  },
  // Table
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 7,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  tableRowEven: {
    backgroundColor: "#F9FAFB",
  },
  tableRowOdd: {
    backgroundColor: "#FFFFFF",
  },
  cell: {
    fontSize: 7.5,
    color: "#111827",
    paddingRight: 4,
  },
  cellMono: {
    fontSize: 7,
    color: "#1D4ED8",
    fontFamily: "Roboto",
  },
  // Variance colors
  varianceNeutral: { color: "#16A34A" },
  varianceLow: { color: "#D97706" },
  varianceHigh: { color: "#DC2626", fontWeight: "bold" },
  // Footer
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryBox: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
    flexWrap: "wrap",
  },
  summaryItem: {
    backgroundColor: "#EFF6FF",
    borderRadius: 4,
    padding: "4 8",
    flexDirection: "row",
    gap: 4,
  },
  signatureBlock: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#374151",
    width: 180,
    paddingTop: 4,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 7,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 28,
    fontSize: 7,
    color: "#9CA3AF",
  },
  infoNote: {
    fontSize: 7,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },
});

// ─── Columnas ─────────────────────────────────────────────────────────────────

const COLS = {
  num:         { width: "4%",  align: "center" as const },
  sku:         { width: "10%", align: "left"   as const },
  name:        { width: "24%", align: "left"   as const },
  location:    { width: "12%", align: "center" as const },
  expected:    { width: "9%",  align: "center" as const },
  counted:     { width: "9%",  align: "center" as const },
  newLocation: { width: "12%", align: "center" as const },
  variance:    { width: "8%",  align: "center" as const },
  notes:       { width: "12%", align: "left"   as const },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CycleCountRouteSheetPDFProps {
  cycleCount: CycleCount & {
    items: Array<
      CycleCountItem & {
        item?: { sku?: string; name?: string; [key: string]: any };
      }
    >;
  };
  warehouseName?: string;
  empresaName?: string;
}

// ─── Helper: ordenar ítems por ubicación luego SKU ───────────────────────────

function sortItems(items: CycleCountRouteSheetPDFProps["cycleCount"]["items"]) {
  return [...items].sort((a, b) => {
    const locA = (a.location ?? "").toLowerCase();
    const locB = (b.location ?? "").toLowerCase();
    if (!a.location && b.location) return 1;
    if (a.location && !b.location) return -1;
    if (locA !== locB) return locA.localeCompare(locB);
    const skuA = a.item?.sku ?? "";
    const skuB = b.item?.sku ?? "";
    return skuA.localeCompare(skuB);
  });
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CycleCountRouteSheetPDF({
  cycleCount,
  warehouseName,
  empresaName,
}: CycleCountRouteSheetPDFProps) {
  const isCompleted = ["APPROVED", "APPLIED"].includes(cycleCount.status);
  const sortedItems = sortItems(cycleCount.items);
  const dateStr = new Date(cycleCount.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusLabel =
    CYCLE_COUNT_STATUS_CONFIG[cycleCount.status as keyof typeof CYCLE_COUNT_STATUS_CONFIG]
      ?.label ?? cycleCount.status;

  const totalContados = sortedItems.filter(
    (i) => i.countedQuantity !== null && i.countedQuantity !== undefined
  ).length;

  const cellStyle = (align: "left" | "center" | "right" = "left") => ({
    textAlign: align,
  });

  return (
    <Document title={`Hoja de Ruta - ${cycleCount.cycleCountNumber}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>
            HOJA DE RUTA — CONTEO CÍCLICO
          </Text>
          {empresaName && (
            <Text style={styles.subtitle}>{empresaName}</Text>
          )}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Número:</Text>
              <Text style={styles.metaValue}>{cycleCount.cycleCountNumber}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Almacén:</Text>
              <Text style={styles.metaValue}>
                {warehouseName ?? cycleCount.warehouse?.name ?? "—"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Fecha:</Text>
              <Text style={styles.metaValue}>{dateStr}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Estado:</Text>
              <Text style={styles.metaValue}>{statusLabel}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Total Ítems:</Text>
              <Text style={styles.metaValue}>{sortedItems.length}</Text>
            </View>
          </View>
          {!isCompleted && (
            <Text style={styles.infoNote}>
              * Hoja de ruta para conteo físico. Complete la columna "Cant. Contada" y "Nueva Ubicación" si corresponde.
            </Text>
          )}
        </View>

        {/* ── Tabla ── */}
        <View style={styles.table}>
          {/* Headers */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: COLS.num.width, textAlign: "center" }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { width: COLS.sku.width }]}>SKU</Text>
            <Text style={[styles.tableHeaderCell, { width: COLS.name.width }]}>Descripción</Text>
            <Text style={[styles.tableHeaderCell, { width: COLS.location.width, textAlign: "center" }]}>Ubic. Sistema</Text>
            <Text style={[styles.tableHeaderCell, { width: COLS.expected.width, textAlign: "center" }]}>Cant. Sistema</Text>
            <Text style={[styles.tableHeaderCell, { width: COLS.counted.width, textAlign: "center" }]}>
              {isCompleted ? "Cant. Contada" : "Cant. Contada*"}
            </Text>
            <Text style={[styles.tableHeaderCell, { width: COLS.newLocation.width, textAlign: "center" }]}>
              {isCompleted ? "Ubic. Conteo" : "Nueva Ubic.*"}
            </Text>
            <Text style={[styles.tableHeaderCell, { width: COLS.variance.width, textAlign: "center" }]}>Varianza</Text>
            <Text style={[styles.tableHeaderCell, { width: COLS.notes.width }]}>Notas</Text>
          </View>

          {/* Data rows */}
          {sortedItems.map((item, index) => {
            const variance =
              item.countedQuantity !== null && item.countedQuantity !== undefined
                ? item.countedQuantity - item.expectedQuantity
                : null;

            const varianceStyle =
              variance === null
                ? {}
                : Math.abs(variance) > 5
                ? styles.varianceHigh
                : variance !== 0
                ? styles.varianceLow
                : styles.varianceNeutral;

            return (
              <View
                key={item.id}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                ]}
                wrap={false}
              >
                <Text style={[styles.cell, { width: COLS.num.width, textAlign: "center" }]}>
                  {index + 1}
                </Text>
                <Text style={[styles.cell, { width: COLS.sku.width }]}>
                  {item.item?.sku ?? "—"}
                </Text>
                <Text style={[styles.cell, { width: COLS.name.width }]}>
                  {item.item?.name ?? "—"}
                </Text>
                <Text style={[styles.cell, styles.cellMono, { width: COLS.location.width, textAlign: "center" }]}>
                  {item.location ?? "—"}
                </Text>
                <Text style={[styles.cell, { width: COLS.expected.width, textAlign: "center" }]}>
                  {item.expectedQuantity}
                </Text>
                <Text style={[styles.cell, { width: COLS.counted.width, textAlign: "center" }]}>
                  {isCompleted && item.countedQuantity !== null && item.countedQuantity !== undefined
                    ? String(item.countedQuantity)
                    : ""}
                </Text>
                <Text style={[styles.cell, styles.cellMono, { width: COLS.newLocation.width, textAlign: "center" }]}>
                  {""}
                </Text>
                <Text style={[styles.cell, varianceStyle, { width: COLS.variance.width, textAlign: "center" }]}>
                  {variance !== null
                    ? variance > 0
                      ? `+${variance}`
                      : String(variance)
                    : ""}
                </Text>
                <Text style={[styles.cell, { width: COLS.notes.width }]}>
                  {item.notes ?? ""}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Resumen ── */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={[styles.metaLabel, { fontSize: 7 }]}>Total ítems:</Text>
            <Text style={{ fontSize: 7, fontWeight: "bold" }}>{sortedItems.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.metaLabel, { fontSize: 7 }]}>Contados:</Text>
            <Text style={{ fontSize: 7, fontWeight: "bold", color: "#16A34A" }}>{totalContados}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.metaLabel, { fontSize: 7 }]}>Pendientes:</Text>
            <Text style={{ fontSize: 7, fontWeight: "bold", color: "#DC2626" }}>
              {sortedItems.length - totalContados}
            </Text>
          </View>
        </View>

        {/* ── Firma ── */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>
            Responsable del Conteo
          </Text>
          <Text style={styles.signatureLine}>
            Supervisor / Aprobador
          </Text>
          <Text style={styles.signatureLine}>
            Fecha de Conteo: ____/____/______
          </Text>
        </View>

        {/* Número de página */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Pág. ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
