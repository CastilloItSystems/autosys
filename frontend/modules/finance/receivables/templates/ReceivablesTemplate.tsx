import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import "@/utils/pdfUtils";
import { ReceivableItem } from "../services/receivablesService";

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
  overdueRow: { backgroundColor: "#fef2f2" },
  tableCell: { fontSize: 8, color: "#334155" },
  totalsBox: {
    marginTop: 8,
    alignItems: "flex-end",
    gap: 3,
  },
  totalLine: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  totalLabel: { fontSize: 8, color: "#64748b", width: 110, textAlign: "right" },
  totalValue: { fontSize: 9, color: "#1e293b", fontFamily: "Roboto-Bold", width: 100, textAlign: "right" },
  grandTotal: { fontSize: 11, color: "#1e3a8a", fontFamily: "Roboto-Bold", width: 100, textAlign: "right" },
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
  agingBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    fontSize: 7,
    fontFamily: "Roboto-Bold",
  },
});

const formatDate = (d?: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("es-VE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatAmount = (value: number | string, currency = "USD") => {
  const sym = { USD: "$", EUR: "€", VES: "Bs." }[currency] ?? "$";
  return `${sym} ${Number(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const agingColors: Record<string, { bg: string; text: string }> = {
  "0-30": { bg: "#dcfce7", text: "#166534" },
  "31-60": { bg: "#fef9c3", text: "#854d0e" },
  "61-90": { bg: "#fed7aa", text: "#9a3412" },
  "+90": { bg: "#fecaca", text: "#991b1b" },
  "sin-vencimiento": { bg: "#e2e8f0", text: "#475569" },
};

const agingLabel: Record<string, string> = {
  "0-30": "Corriente",
  "31-60": "31–60 días",
  "61-90": "61–90 días",
  "+90": "+90 días",
  "sin-vencimiento": "Sin vencimiento",
};

interface ReceivablesTemplateProps {
  data: ReceivableItem;
}

const ReceivablesTemplate = ({ data }: ReceivablesTemplateProps) => {
  const agingColor = agingColors[data.agingBucket] || agingColors["sin-vencimiento"];

  return (
    <Document title={`Cuenta por Cobrar - ${data.preInvoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>Estado de Cuenta — Cuentas por Cobrar</Text>
              <Text style={styles.headerSubtitle}>AutoSys</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerNumber}>{data.preInvoiceNumber}</Text>
            <Text style={styles.headerDate}>{formatDate(data.createdAt)}</Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>{data.customer?.name || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Código:</Text>
                <Text style={styles.value}>{data.customer?.code || "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>RIF / Tax ID:</Text>
                <Text style={styles.value}>{data.customer?.taxId || "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de la Cuenta</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Total factura:</Text>
                <Text style={styles.value}>{formatAmount(data.total, data.currency)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Monto pagado:</Text>
                <Text style={styles.value}>{formatAmount(data.paidAmount, data.currency)}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Saldo pendiente:</Text>
                <Text style={[styles.value, { fontFamily: "Roboto-Bold", color: "#1e3a8a" }]}>
                  {formatAmount(data.pendingAmount, data.currency)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Vencimiento:</Text>
                <Text style={styles.value}>{formatDate(data.dueDate)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Aging:</Text>
                <Text
                  style={[
                    styles.agingBadge,
                    { backgroundColor: agingColor.bg, color: agingColor.text },
                  ]}
                >
                  {agingLabel[data.agingBucket] || data.agingBucket}
                </Text>
              </View>
              {data.daysOverdue != null && data.daysOverdue > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>Días vencido:</Text>
                  <Text style={[styles.value, { color: "#dc2626", fontFamily: "Roboto-Bold" }]}>
                    {data.daysOverdue} días
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>AutoSys</Text>
          <Text style={styles.footerText}>{data.preInvoiceNumber}</Text>
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

export default ReceivablesTemplate;
