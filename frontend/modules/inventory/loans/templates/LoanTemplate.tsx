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
  Loan,
  LoanStatus,
  LOAN_STATUS_CONFIG,
} from "../services/loanService";

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
  notesLabel: {
    fontSize: 8,
    fontFamily: "Roboto-Bold",
    color: "#64748b",
    marginBottom: 2,
  },
  overdueText: { color: "#991b1b", fontFamily: "Roboto-Bold" },
  signatureBlock: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    width: 150,
    paddingTop: 4,
    textAlign: "center",
    color: "#64748b",
    fontSize: 8,
  },
});

const formatDate = (d?: Date | string | null) => {
  if (!d) return "N/A";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-VE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const statusBadgeColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#f3f4f6", text: "#374151" },
  PENDING_APPROVAL: { bg: "#fef9c3", text: "#854d0e" },
  APPROVED: { bg: "#dcfce7", text: "#166534" },
  ACTIVE: { bg: "#dbeafe", text: "#1e40af" },
  RETURNED: { bg: "#dcfce7", text: "#166534" },
  OVERDUE: { bg: "#fecaca", text: "#991b1b" },
  CANCELLED: { bg: "#fecaca", text: "#991b1b" },
};

const LoanTemplate = ({ data }: { data: Loan }) => {
  const cfg = LOAN_STATUS_CONFIG[data.status];
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.DRAFT;
  const isOverdue = data.status === LoanStatus.OVERDUE;

  const warehouseName =
    (data as Loan & { warehouse?: { name?: string } }).warehouse?.name ??
    data.warehouseId;

  return (
    <Document title={"Préstamo - " + data.loanNumber}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>Orden de Préstamo</Text>
              <Text style={styles.headerSubtitle}>AutoSys</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerNumber}>{data.loanNumber}</Text>
            <Text style={styles.headerDate}>{formatDate(data.startDate)}</Text>
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

        {/* Datos generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Préstamo</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Prestatario:</Text>
                <Text style={styles.value}>
                  {data.borrowerName +
                    (data.borrowerId ? " (" + data.borrowerId + ")" : "")}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Almacén:</Text>
                <Text style={styles.value}>{warehouseName}</Text>
              </View>
              {data.purpose ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Propósito:</Text>
                  <Text style={styles.value}>{data.purpose}</Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <Text style={styles.label}>Creado por:</Text>
                <Text style={styles.value}>{data.createdBy}</Text>
              </View>
            </View>
            <View style={styles.col}>
              {data.approvedBy ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Aprobado por:</Text>
                  <Text style={styles.value}>
                    {data.approvedBy +
                      (data.approvedAt
                        ? " (" + formatDate(data.approvedAt) + ")"
                        : "")}
                  </Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <Text style={styles.label}>Fecha inicio:</Text>
                <Text style={styles.value}>{formatDate(data.startDate)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Fecha límite:</Text>
                <Text
                  style={[
                    styles.value,
                    isOverdue ? styles.overdueText : {},
                  ]}
                >
                  {formatDate(data.dueDate) + (isOverdue ? " — VENCIDO" : "")}
                </Text>
              </View>
              {data.returnedAt ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Devuelto el:</Text>
                  <Text style={styles.value}>{formatDate(data.returnedAt)}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Items */}
        {Array.isArray(data.items) && data.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artículos Prestados</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "32%" }]}>Artículo</Text>
                <Text style={[styles.tableHeaderCell, { width: "18%" }]}>SKU</Text>
                <Text style={[styles.tableHeaderCell, { width: "12%", textAlign: "center" }]}>Prestado</Text>
                <Text style={[styles.tableHeaderCell, { width: "12%", textAlign: "center" }]}>Devuelto</Text>
                <Text style={[styles.tableHeaderCell, { width: "12%", textAlign: "center" }]}>Pendiente</Text>
                <Text style={[styles.tableHeaderCell, { width: "14%", textAlign: "right" }]}>Costo U.</Text>
              </View>
              {data.items.map((line, idx) => {
                const itemName = line.item?.name ?? line.itemId;
                const itemSku = line.item?.sku ?? "—";
                const pending = line.quantityLoaned - line.quantityReturned;
                return (
                  <View
                    key={line.id}
                    style={[
                      styles.tableRow,
                      idx % 2 === 1 ? styles.tableRowAlt : {},
                    ]}
                  >
                    <Text style={[styles.tableCell, { width: "32%" }]}>
                      {itemName}
                    </Text>
                    <Text style={[styles.tableCell, { width: "18%" }]}>
                      {itemSku}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { width: "12%", textAlign: "center" },
                      ]}
                    >
                      {String(line.quantityLoaned)}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { width: "12%", textAlign: "center" },
                      ]}
                    >
                      {String(line.quantityReturned)}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { width: "12%", textAlign: "center" },
                      ]}
                    >
                      {String(pending)}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { width: "14%", textAlign: "right" },
                      ]}
                    >
                      {"$" + Number(line.unitCost).toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Notas */}
        {data.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        ) : null}

        {/* Firmas */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>Prestatario</Text>
          <Text style={styles.signatureLine}>Responsable almacén</Text>
          <Text style={styles.signatureLine}>Aprobado por</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>AutoSys</Text>
          <Text style={styles.footerText}>{data.loanNumber}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              "Página " + pageNumber + " de " + totalPages
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export default LoanTemplate;
