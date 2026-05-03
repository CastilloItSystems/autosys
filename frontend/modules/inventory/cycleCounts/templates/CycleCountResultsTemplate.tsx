import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import "@/utils/pdfUtils";
import {
  CycleCount,
  CycleCountStatus,
  CYCLE_COUNT_STATUS_CONFIG,
} from "@/modules/inventory/cycleCounts/interfaces/cycleCount.interface";

const styles = StyleSheet.create({
  page: {
    paddingTop: 70,
    paddingBottom: 50,
    paddingHorizontal: 30,
    fontFamily: "Roboto",
    fontSize: 9,
    color: "#1e293b",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 8,
    paddingTop: 8,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 13, fontFamily: "Roboto-Bold", color: "#0f172a" },
  headerSubtitle: { fontSize: 8, color: "#64748b", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  headerNumber: { fontSize: 12, fontFamily: "Roboto-Bold", color: "#1e3a8a" },
  headerDate: { fontSize: 8, color: "#64748b", marginTop: 2 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "Roboto-Bold",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Roboto-Bold",
    color: "#1e3a8a",
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
    paddingLeft: 6,
    marginBottom: 6,
  },
  grid2Col: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  row: { flexDirection: "row", marginBottom: 3, alignItems: "flex-start" },
  label: { width: "40%", color: "#64748b", fontSize: 8 },
  value: { width: "60%", fontSize: 8, color: "#1e293b" },
  valueFull: { width: "100%", fontSize: 8, color: "#1e293b", lineHeight: 1.4 },
  // Table
  table: {
    width: "100%",
    marginTop: 6,
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
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  tableCell: { fontSize: 8, color: "#334155" },
  // Totals
  totalsBox: { marginTop: 8, gap: 3 },
  totalLine: { flexDirection: "row", gap: 12 },
  totalLabel: { fontSize: 8, color: "#64748b", width: 160 },
  totalValue: { fontSize: 9, color: "#1e293b", fontFamily: "Roboto-Bold", width: 80 },
  // Signature
  signatureArea: { flexDirection: "row", justifyContent: "space-around", marginTop: 24 },
  signatureBox: { alignItems: "center", width: 140 },
  signatureLine: { borderTopWidth: 1, borderTopColor: "#374151", width: 120, marginBottom: 3 },
  signatureLabel: { fontSize: 7, color: "#6b7280" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: "#94a3b8" },
  notesBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  notesLabel: { fontSize: 8, fontFamily: "Roboto-Bold", color: "#64748b", marginBottom: 2 },
});

const statusBadgeColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#fef9c3", text: "#854d0e" },
  IN_PROGRESS: { bg: "#dbeafe", text: "#1e40af" },
  COMPLETED: { bg: "#dbeafe", text: "#1e40af" },
  APPROVED: { bg: "#dcfce7", text: "#166534" },
  APPLIED: { bg: "#dcfce7", text: "#166534" },
  REJECTED: { bg: "#fecaca", text: "#991b1b" },
  CANCELLED: { bg: "#f1f5f9", text: "#475569" },
};

const formatDate = (d?: Date | string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(d);
  }
};

const CycleCountResultsTemplate = ({ data }: { data: CycleCount }) => {
  const cfg = CYCLE_COUNT_STATUS_CONFIG[data.status];
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.DRAFT;
  const items = data.items || [];
  const itemsWithVariance = items.filter(
    (item) => item.variance !== undefined && item.variance !== null && item.variance !== 0,
  );

  return (
    <Document title={`Conteo Cíclico - ${data.cycleCountNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>Resultados de Conteo Cíclico</Text>
              <Text style={styles.headerSubtitle}>AutoSys — Inventario</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerNumber}>{data.cycleCountNumber}</Text>
            <Text style={styles.headerDate}>
              {data.warehouse?.name || data.warehouseId}
            </Text>
            <Text
              style={[
                styles.badge,
                { backgroundColor: badgeColor.bg, color: badgeColor.text },
              ]}
            >
              {cfg?.label || data.status}
            </Text>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen del Conteo</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Almacén:</Text>
                <Text style={styles.value}>
                  {data.warehouse?.name || data.warehouseId}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Iniciado en:</Text>
                <Text style={styles.value}>{formatDate(data.startedAt)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Completado en:</Text>
                <Text style={styles.value}>{formatDate(data.completedAt)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Iniciado por:</Text>
                <Text style={styles.value}>{data.startedBy || "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Aprobado en:</Text>
                <Text style={styles.value}>{formatDate(data.approvedAt)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Aplicado en:</Text>
                <Text style={styles.value}>{formatDate(data.appliedAt)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Aprobado por:</Text>
                <Text style={styles.value}>{data.approvedBy || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Creado el:</Text>
                <Text style={styles.value}>{formatDate(data.createdAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabla de ítems */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de Ítems</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: "22%" }]}>
                Ítem
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "18%" }]}>
                Ubicación
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: "18%", textAlign: "right" },
                ]}
              >
                Esperado
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: "18%", textAlign: "right" },
                ]}
              >
                Contado
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: "12%", textAlign: "right" },
                ]}
              >
                Varianza
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                Notas
              </Text>
            </View>
            {items.map((item, idx) => {
              const variance =
                item.variance !== undefined && item.variance !== null
                  ? item.variance
                  : item.countedQuantity !== undefined
                    ? item.countedQuantity - item.expectedQuantity
                    : null;
              const varianceColor =
                variance === null
                  ? "#334155"
                  : variance < 0
                    ? "#dc2626"
                    : variance > 0
                      ? "#16a34a"
                      : "#334155";
              return (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { width: "22%" }]}>
                    {item.itemId}
                  </Text>
                  <Text style={[styles.tableCell, { width: "18%" }]}>
                    {item.location || "—"}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: "18%", textAlign: "right" },
                    ]}
                  >
                    {String(item.expectedQuantity)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: "18%", textAlign: "right" },
                    ]}
                  >
                    {item.countedQuantity !== undefined &&
                    item.countedQuantity !== null
                      ? String(item.countedQuantity)
                      : "—"}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      {
                        width: "12%",
                        textAlign: "right",
                        color: varianceColor,
                        fontFamily:
                          variance !== null && variance !== 0
                            ? "Roboto-Bold"
                            : "Roboto",
                      },
                    ]}
                  >
                    {variance === null
                      ? "—"
                      : variance > 0
                        ? `+${variance}`
                        : String(variance)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "12%" }]}>
                    {item.notes || ""}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total de ítems:</Text>
            <Text style={styles.totalValue}>{String(items.length)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Ítems con varianza:</Text>
            <Text style={styles.totalValue}>
              {String(itemsWithVariance.length)}
            </Text>
          </View>
        </View>

        {/* Notas */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

        {/* Firmas */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Realizado por</Text>
            <Text style={[styles.signatureLabel, { marginTop: 2 }]}>
              {data.startedBy || ""}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Aprobado por</Text>
            <Text style={[styles.signatureLabel, { marginTop: 2 }]}>
              {data.approvedBy || ""}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>AutoSys</Text>
          <Text style={styles.footerText}>{data.cycleCountNumber}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export default CycleCountResultsTemplate;
