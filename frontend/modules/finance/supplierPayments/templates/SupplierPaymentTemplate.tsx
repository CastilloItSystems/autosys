import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import PdfDocumentHeader from "@/components/pdf/PdfDocumentHeader";
import PdfDocumentFooter from "@/components/pdf/PdfDocumentFooter";
import type { PdfCompanyInfo } from "@/components/pdf/pdfCompany";
import "@/utils/pdfUtils";
import type { SupplierPayment } from "../interfaces/supplierPayment";

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
  totalsBox: { marginTop: 8, alignItems: "flex-end", gap: 3 },
  totalLine: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  totalLabel: { fontSize: 8, color: "#64748b", width: 120, textAlign: "right" },
  totalValue: {
    fontSize: 9,
    color: "#1e293b",
    fontFamily: "Roboto-Bold",
    width: 90,
    textAlign: "right",
  },
  grandTotal: {
    fontSize: 11,
    color: "#1e3a8a",
    fontFamily: "Roboto-Bold",
    width: 90,
    textAlign: "right",
  },
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
  signatureArea: { flexDirection: "row", justifyContent: "space-around", marginTop: 24 },
  signatureBox: { alignItems: "center", width: 140 },
  signatureLine: { borderTopWidth: 1, borderTopColor: "#374151", width: 120, marginBottom: 3 },
  signatureLabel: { fontSize: 7, color: "#6b7280" },
});

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#fef9c3", text: "#854d0e" },
  COMPLETED: { bg: "#dcfce7", text: "#166534" },
  CANCELLED: { bg: "#f1f5f9", text: "#475569" },
  REFUNDED: { bg: "#dbeafe", text: "#1e40af" },
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  MOBILE_PAYMENT: "Pago Móvil",
  CHECK: "Cheque",
  CREDIT: "Crédito",
  MIXED: "Mixto",
};

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

const SupplierPaymentTemplate = ({ data, company }: { data: SupplierPayment; company?: PdfCompanyInfo }) => {
  const badgeColor = STATUS_COLORS[data.status] ?? STATUS_COLORS.PENDING;
  const cur = data.currency ?? "USD";

  return (
    <Document title={`Pago a Proveedor - ${data.paymentNumber}`}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Comprobante de Pago a Proveedor"
          documentNumber={data.paymentNumber}
          date={formatDate(data.processedAt)}
          status={STATUS_LABELS[data.status] ?? data.status}
          statusColor={badgeColor}
        />

        {/* Detalles del Pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Pago</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Proveedor:</Text>
                <Text style={styles.value}>{data.supplier?.name ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Factura:</Text>
                <Text style={styles.value}>
                  {data.supplierBill
                    ? data.supplierBill.internalNumber
                    : "—"}
                </Text>
              </View>
              {data.supplierBill?.billNumber && (
                <View style={styles.row}>
                  <Text style={styles.label}>N° Factura Prov.:</Text>
                  <Text style={styles.value}>{data.supplierBill.billNumber}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Método de Pago:</Text>
                <Text style={styles.value}>
                  {METHOD_LABELS[data.method] ?? data.method}
                </Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Cuenta Bancaria:</Text>
                <Text style={styles.value}>{data.bankAccount?.name ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Moneda:</Text>
                <Text style={styles.value}>{data.currency}</Text>
              </View>
              {data.exchangeRate != null && (
                <View style={styles.row}>
                  <Text style={styles.label}>Tasa de Cambio:</Text>
                  <Text style={styles.value}>{String(data.exchangeRate)}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Referencia:</Text>
                <Text style={styles.value}>{data.reference ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Procesado por:</Text>
                <Text style={styles.value}>{data.processedByName ?? data.processedBy ?? "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Monto:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.amount, cur)}</Text>
          </View>
          {data.igtfApplies && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>IGTF:</Text>
              <Text style={styles.totalValue}>
                {formatAmount(data.igtfAmount, cur)}
              </Text>
            </View>
          )}
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total con IGTF:</Text>
            <Text style={styles.grandTotal}>
              {formatAmount(data.totalWithIgtf, cur)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Autorizado por</Text>
          </View>
        </View>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.paymentNumber}
        />
      </Page>
    </Document>
  );
};

export default SupplierPaymentTemplate;
