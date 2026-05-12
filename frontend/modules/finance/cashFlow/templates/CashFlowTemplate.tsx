import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import PdfDocumentHeader from "@/components/pdf/PdfDocumentHeader";
import PdfDocumentFooter from "@/components/pdf/PdfDocumentFooter";
import type { PdfCompanyInfo } from "@/components/pdf/pdfCompany";
import "@/utils/pdfUtils";
import type { CashTransaction } from "../interfaces/cashTransaction";

export interface CashFlowTemplateData {
  transactions: CashTransaction[];
  accountName?: string;
  periodFrom?: string;
  periodTo?: string;
  totalIncome: number;
  totalOutcome: number;
  netFlow: number;
  currency: string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 88,
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
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  summaryCard: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryCardLabel: { fontSize: 7, color: "#64748b", marginBottom: 2 },
  summaryCardValue: { fontSize: 10, fontFamily: "Roboto-Bold" },
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
  tableHeaderCell: { color: "#ffffff", fontFamily: "Roboto-Bold", fontSize: 8 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  tableCell: { fontSize: 7.5, color: "#334155" },
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
});

const TYPE_LABELS: Record<string, string> = {
  INCOME: "Ingreso",
  OUTCOME: "Egreso",
  TRANSFER_IN: "Transferencia Entrada",
  TRANSFER_OUT: "Transferencia Salida",
  ADJUSTMENT: "Ajuste",
};

const SOURCE_LABELS: Record<string, string> = {
  SALES_PAYMENT: "Cobro de Venta",
  SUPPLIER_PAYMENT: "Pago a Proveedor",
  EXPENSE: "Gasto",
  MANUAL: "Manual",
  TRANSFER: "Transferencia",
};

const formatDate = (d?: string | null) => {
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

const formatAmount = (value?: number | null, currency = "USD") => {
  if (value == null) return "—";
  const sym = { USD: "$", EUR: "€", VES: "Bs." }[currency] ?? currency;
  return `${sym} ${Number(value).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const CashFlowTemplate = ({ data, company }: { data: CashFlowTemplateData; company?: PdfCompanyInfo }) => {
  const cur = data.currency ?? "USD";

  return (
    <Document title="Flujo de Caja">
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Flujo de Caja"
          documentNumber={data.accountName ? data.accountName : "Todas las cuentas"}
          date={data.periodFrom && data.periodTo ? `${formatDate(data.periodFrom)} - ${formatDate(data.periodTo)}` : undefined}
        />

        {/* Summary Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen del Período</Text>
          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
              ]}
            >
              <Text style={styles.summaryCardLabel}>Total Ingresos</Text>
              <Text style={[styles.summaryCardValue, { color: "#166534" }]}>
                {formatAmount(data.totalIncome, cur)}
              </Text>
            </View>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
              ]}
            >
              <Text style={styles.summaryCardLabel}>Total Egresos</Text>
              <Text style={[styles.summaryCardValue, { color: "#991b1b" }]}>
                {formatAmount(data.totalOutcome, cur)}
              </Text>
            </View>
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: data.netFlow >= 0 ? "#eff6ff" : "#fff7ed",
                  borderColor: data.netFlow >= 0 ? "#bfdbfe" : "#fed7aa",
                },
              ]}
            >
              <Text style={styles.summaryCardLabel}>Flujo Neto</Text>
              <Text
                style={[
                  styles.summaryCardValue,
                  { color: data.netFlow >= 0 ? "#1e40af" : "#c2410c" },
                ]}
              >
                {formatAmount(data.netFlow, cur)}
              </Text>
            </View>
          </View>
        </View>

        {/* Transactions Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {`Movimientos (${data.transactions.length})`}
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: 56 }]}>Fecha</Text>
              <Text style={[styles.tableHeaderCell, { width: 80 }]}>Tipo</Text>
              <Text style={[styles.tableHeaderCell, { width: 80 }]}>Origen</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Descripción</Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: 70, textAlign: "right" },
                ]}
              >
                Monto
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: 70, textAlign: "right" },
                ]}
              >
                Saldo Acum.
              </Text>
            </View>
            {data.transactions.map((tx, idx) => {
              const isIncome =
                tx.type === "INCOME" || tx.type === "TRANSFER_IN";
              const amountColor = isIncome ? "#166534" : "#991b1b";
              const sign = isIncome ? "+" : "";
              return (
                <View
                  key={tx.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { width: 56 }]}>
                    {formatDate(tx.transactionDate)}
                  </Text>
                  <Text style={[styles.tableCell, { width: 80 }]}>
                    {TYPE_LABELS[tx.type] ?? tx.type}
                  </Text>
                  <Text style={[styles.tableCell, { width: 80 }]}>
                    {SOURCE_LABELS[tx.source] ?? tx.source}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {tx.description ?? "—"}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 70, textAlign: "right", color: amountColor },
                    ]}
                  >
                    {`${sign}${formatAmount(Math.abs(Number(tx.amount)), tx.currency)}`}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 70, textAlign: "right" },
                    ]}
                  >
                    {tx.runningBalance != null
                      ? formatAmount(tx.runningBalance, tx.currency)
                      : "—"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.accountName || "Flujo de Caja"}
        />
      </Page>
    </Document>
  );
};

export default CashFlowTemplate;
