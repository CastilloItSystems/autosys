import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import PdfDocumentHeader from "@/components/pdf/PdfDocumentHeader";
import PdfDocumentFooter from "@/components/pdf/PdfDocumentFooter";
import type { PdfCompanyInfo } from "@/components/pdf/pdfCompany";
import "@/utils/pdfUtils";
import {
  Payment,
  PaymentStatus,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
  PaymentMethod,
} from "../interfaces/payment.interface";

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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
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
  totalLabel: { fontSize: 8, color: "#64748b", width: 100, textAlign: "right" },
  totalValue: { fontSize: 9, color: "#1e293b", fontFamily: "Roboto-Bold", width: 90, textAlign: "right" },
  grandTotal: { fontSize: 11, color: "#1e3a8a", fontFamily: "Roboto-Bold", width: 90, textAlign: "right" },
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

const formatDate = (d?: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("es-VE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAmount = (value: number | string, currency = "USD") => {
  const sym = { USD: "$", EUR: "€", VES: "Bs." }[currency] ?? "$";
  return `${sym} ${Number(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const statusBadgeColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#fef9c3", text: "#854d0e" },
  COMPLETED: { bg: "#dcfce7", text: "#166534" },
  CANCELLED: { bg: "#fecaca", text: "#991b1b" },
  REFUNDED: { bg: "#dbeafe", text: "#1e40af" },
};

const PaymentReceiptTemplate = ({ data, company }: { data: Payment; company?: PdfCompanyInfo }) => {
  const cfg = PAYMENT_STATUS_CONFIG[data.status];
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.PENDING;

  return (
    <Document title={`Comprobante de Pago - ${data.paymentNumber}`}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Comprobante de Pago"
          documentNumber={data.paymentNumber}
          date={formatDate(data.processedAt)}
          status={cfg?.label || data.status}
          statusColor={badgeColor}
        />

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

        {/* Métodos de Pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglose de Pago</Text>
          {Array.isArray(data.details) && data.details.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Método</Text>
                <Text style={[styles.tableHeaderCell, { width: "25%", textAlign: "right" }]}>Monto</Text>
                <Text style={[styles.tableHeaderCell, { width: "25%" }]}>Moneda</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Referencia</Text>
              </View>
              {(data.details ?? []).map((detail, idx) => {
                const methodCfg = PAYMENT_METHOD_CONFIG[detail.method as PaymentMethod];
                return (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 1 ? styles.tableRowAlt : {},
                    ]}
                  >
                    <Text style={[styles.tableCell, { width: "30%" }]}>
                      {methodCfg?.label || detail.method}
                    </Text>
                    <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                      {formatAmount(detail.amount, detail.currency || data.currency)}
                    </Text>
                    <Text style={[styles.tableCell, { width: "25%" }]}>
                      {detail.currency || data.currency}
                    </Text>
                    <Text style={[styles.tableCell, { width: "20%" }]}>
                      {detail.reference || "—"}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.row}>
              <Text style={styles.label}>Método:</Text>
              <Text style={styles.value}>
                {PAYMENT_METHOD_CONFIG[data.method as PaymentMethod]?.label || data.method}
              </Text>
            </View>
          )}
        </View>

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Monto:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.amount, data.currency)}</Text>
          </View>
          {data.igtfApplies && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>IGTF:</Text>
              <Text style={styles.totalValue}>{formatAmount(data.igtfAmount, data.currency)}</Text>
            </View>
          )}
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total con IGTF:</Text>
            <Text style={styles.grandTotal}>{formatAmount(data.totalWithIgtf, data.currency)}</Text>
          </View>
          {data.exchangeRate && (
            <Text style={{ fontSize: 7, color: "#94a3b8", marginTop: 2 }}>
              Tasa: {data.exchangeRate}
            </Text>
          )}
        </View>

        {/* Pre-factura */}
        {data.preInvoice && (
          <View style={[styles.section, { marginTop: 12 }]}>
            <Text style={styles.sectionTitle}>Pre-Factura Asociada</Text>
            <View style={styles.grid2Col}>
              <View style={styles.col}>
                <View style={styles.row}>
                  <Text style={styles.label}>Número:</Text>
                  <Text style={styles.value}>{data.preInvoice.preInvoiceNumber}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Total PF:</Text>
                  <Text style={styles.value}>{formatAmount(data.preInvoice.total, data.currency)}</Text>
                </View>
              </View>
              {data.preInvoice.order && (
                <View style={styles.col}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Orden:</Text>
                    <Text style={styles.value}>{data.preInvoice.order.orderNumber}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Procesado por y notas */}
        <View style={styles.grid2Col}>
          <View style={styles.col}>
            <View style={styles.row}>
              <Text style={styles.label}>Procesado por:</Text>
              <Text style={styles.value}>{data.processedByName || data.processedBy || "—"}</Text>
            </View>
          </View>
        </View>

        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.paymentNumber}
        />
      </Page>
    </Document>
  );
};

export default PaymentReceiptTemplate;
