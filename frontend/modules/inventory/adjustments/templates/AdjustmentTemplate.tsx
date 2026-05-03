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
  Adjustment,
  AdjustmentStatus,
  ADJUSTMENT_STATUS_LABELS,
} from "@/modules/inventory/adjustments/services/adjustmentService";

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
  totalsBox: {
    marginTop: 8,
    alignItems: "flex-end",
    gap: 3,
  },
  totalLine: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  totalLabel: { fontSize: 8, color: "#64748b", width: 140, textAlign: "right" },
  totalValue: { fontSize: 9, color: "#1e293b", fontFamily: "Roboto-Bold", width: 90, textAlign: "right" },
  // Signature
  signatureArea: { flexDirection: "row", justifyContent: "space-around", marginTop: 24 },
  signatureBox: { alignItems: "center", width: 120 },
  signatureLine: { borderTopWidth: 1, borderTopColor: "#374151", width: 100, marginBottom: 3 },
  signatureLabel: { fontSize: 7, color: "#6b7280", textAlign: "center" },
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
  DRAFT: { bg: "#dbeafe", text: "#1e40af" },
  APPROVED: { bg: "#fef9c3", text: "#854d0e" },
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

const AdjustmentTemplate = ({ data }: { data: Adjustment }) => {
  const statusLabel =
    ADJUSTMENT_STATUS_LABELS[data.status as AdjustmentStatus] || data.status;
  const badgeColor =
    statusBadgeColors[data.status] || statusBadgeColors.DRAFT;
  const items = data.items || [];

  // Estimated total impact (sum of quantityChange * unitCost)
  const totalImpact = items.reduce((acc, item) => {
    // AdjustmentItem from service doesn't have unitCost — use 0 if missing
    return acc + item.quantityChange * 0;
  }, 0);

  return (
    <Document title={`Ajuste de Inventario - ${data.adjustmentNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>Ajuste de Inventario</Text>
              <Text style={styles.headerSubtitle}>AutoSys — Inventario</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerNumber}>{data.adjustmentNumber}</Text>
            <Text style={styles.headerDate}>{formatDate(data.createdAt)}</Text>
            <Text
              style={[
                styles.badge,
                { backgroundColor: badgeColor.bg, color: badgeColor.text },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Datos generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Ajuste</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Almacén:</Text>
                <Text style={styles.value}>
                  {data.warehouse
                    ? `${data.warehouse.name} (${data.warehouse.code})`
                    : data.warehouseId}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Motivo:</Text>
                <Text style={styles.value}>{data.reason}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Creado por:</Text>
                <Text style={styles.value}>{data.createdBy || "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Aprobado por:</Text>
                <Text style={styles.value}>{data.approvedBy || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Aprobado el:</Text>
                <Text style={styles.value}>{formatDate(data.approvedAt)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Aplicado por:</Text>
                <Text style={styles.value}>{data.appliedBy || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Aplicado el:</Text>
                <Text style={styles.value}>{formatDate(data.appliedAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabla de ítems */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ítems Ajustados</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: "30%" }]}>
                Ítem
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: "20%", textAlign: "center" },
                ]}
              >
                Cambio
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: "20%", textAlign: "right" },
                ]}
              >
                Cant. Actual
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: "20%", textAlign: "right" },
                ]}
              >
                Cant. Nueva
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
                Notas
              </Text>
            </View>
            {items.map((item, idx) => {
              const qChange = item.quantityChange;
              const changeColor =
                qChange < 0 ? "#dc2626" : qChange > 0 ? "#16a34a" : "#334155";
              const changeText =
                qChange > 0 ? `+${qChange}` : String(qChange);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { width: "30%" }]}>
                    {item.item ? `${item.item.sku} — ${item.item.name}` : item.itemId}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      {
                        width: "20%",
                        textAlign: "center",
                        color: changeColor,
                        fontFamily: "Roboto-Bold",
                      },
                    ]}
                  >
                    {changeText}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: "20%", textAlign: "right" },
                    ]}
                  >
                    {item.currentQuantity !== undefined &&
                    item.currentQuantity !== null
                      ? String(item.currentQuantity)
                      : "—"}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: "20%", textAlign: "right" },
                    ]}
                  >
                    {item.newQuantity !== undefined && item.newQuantity !== null
                      ? String(item.newQuantity)
                      : "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>
                    {item.reason || ""}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total de ítems ajustados:</Text>
            <Text style={styles.totalValue}>{String(items.length)}</Text>
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
            <Text style={styles.signatureLabel}>Creado por</Text>
            <Text style={[styles.signatureLabel, { marginTop: 2 }]}>
              {data.createdBy || ""}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Aprobado por</Text>
            <Text style={[styles.signatureLabel, { marginTop: 2 }]}>
              {data.approvedBy || ""}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Aplicado por</Text>
            <Text style={[styles.signatureLabel, { marginTop: 2 }]}>
              {data.appliedBy || ""}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>AutoSys</Text>
          <Text style={styles.footerText}>{data.adjustmentNumber}</Text>
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

export default AdjustmentTemplate;
