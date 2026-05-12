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
import { Quote, QuoteStatus, QUOTE_STATUS_CONFIG } from "../interfaces/quote.interface";

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
  notesBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  notesLabel: { fontSize: 8, fontFamily: "Roboto-Bold", color: "#64748b", marginBottom: 2 },
  signatureBlock: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    width: 160,
    paddingTop: 4,
    textAlign: "center",
    color: "#64748b",
    fontSize: 8,
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

const formatAmount = (value: number, currency = "USD") => {
  const sym = { USD: "$", EUR: "€", VES: "Bs." }[currency] ?? "$";
  return `${sym} ${Number(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const statusBadgeColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#f3f4f6", text: "#374151" },
  ISSUED: { bg: "#dbeafe", text: "#1e40af" },
  SENT: { bg: "#fef9c3", text: "#854d0e" },
  NEGOTIATING: { bg: "#fef9c3", text: "#854d0e" },
  APPROVED: { bg: "#dcfce7", text: "#166534" },
  REJECTED: { bg: "#fecaca", text: "#991b1b" },
  EXPIRED: { bg: "#e5e7eb", text: "#374151" },
  CONVERTED: { bg: "#e0e7ff", text: "#3730a3" },
};

const CRMQuoteTemplate = ({ data, company }: { data: Quote; company?: PdfCompanyInfo }) => {
  const cfg = QUOTE_STATUS_CONFIG[data.status];
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.DRAFT;

  return (
    <Document title={`Cotización CRM - ${data.quoteNumber}`}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Cotizacion"
          documentNumber={data.quoteNumber}
          date={formatDate(data.createdAt)}
          status={cfg?.label || data.status}
          statusColor={badgeColor}
          type={data.version > 1 ? `Version: ${data.version}` : undefined}
        />

        {/* Cliente / Prospecto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente / Prospecto</Text>
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
              {data.lead && (
                <View style={styles.row}>
                  <Text style={styles.label}>Oportunidad:</Text>
                  <Text style={styles.value}>{data.lead.title}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Tipo:</Text>
                <Text style={styles.value}>{data.type}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items */}
        {data.items && data.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ítems / Servicios</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "40%" }]}>Descripción</Text>
                <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "center" }]}>Cant.</Text>
                <Text style={[styles.tableHeaderCell, { width: "14%", textAlign: "right" }]}>Precio</Text>
                <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "center" }]}>Desc.%</Text>
                <Text style={[styles.tableHeaderCell, { width: "12%", textAlign: "center" }]}>Imp.</Text>
                <Text style={[styles.tableHeaderCell, { width: "14%", textAlign: "right" }]}>Total</Text>
              </View>
              {data.items.map((line, idx) => (
                <View
                  key={line.id || idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { width: "40%" }]}>{line.description}</Text>
                  <Text style={[styles.tableCell, { width: "10%", textAlign: "center" }]}>
                    {line.quantity}
                  </Text>
                  <Text style={[styles.tableCell, { width: "14%", textAlign: "right" }]}>
                    {formatAmount(line.unitPrice, data.currency)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "10%", textAlign: "center" }]}>
                    {Number(line.discountPct) > 0 ? `${line.discountPct}%` : "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "12%", textAlign: "center" }]}>
                    {line.taxPct}%
                  </Text>
                  <Text style={[styles.tableCell, { width: "14%", textAlign: "right", fontFamily: "Roboto-Bold" }]}>
                    {formatAmount(line.total, data.currency)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.subtotal, data.currency)}</Text>
          </View>
          {Number(data.discountAmt) > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Descuento:</Text>
              <Text style={styles.totalValue}>-{formatAmount(data.discountAmt, data.currency)}</Text>
            </View>
          )}
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Impuestos:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.taxAmt, data.currency)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.grandTotal}>{formatAmount(data.total, data.currency)}</Text>
          </View>
        </View>

        {/* Condiciones */}
        <View style={[styles.section, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Condiciones Comerciales</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              {data.paymentTerms && (
                <View style={styles.row}>
                  <Text style={styles.label}>Términos de pago:</Text>
                  <Text style={styles.value}>{data.paymentTerms}</Text>
                </View>
              )}
            </View>
            <View style={styles.col}>
              {data.deliveryTerms && (
                <View style={styles.row}>
                  <Text style={styles.label}>Términos de entrega:</Text>
                  <Text style={styles.value}>{data.deliveryTerms}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

        {/* Firma */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>Vendedor</Text>
        </View>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.quoteNumber}
        />
      </Page>
    </Document>
  );
};

export default CRMQuoteTemplate;
