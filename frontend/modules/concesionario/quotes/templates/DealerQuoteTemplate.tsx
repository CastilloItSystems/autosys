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
import { DealerQuote } from "../interfaces/dealerQuote.interface";

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
    justifyContent: "space-between",
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
  vehicleBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 4,
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

const formatAmount = (value: string | number | null | undefined, currency = "USD") => {
  const sym = { USD: "$", EUR: "€", VES: "Bs." }[currency] ?? "$";
  return `${sym} ${Number(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const statusBadgeColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#f3f4f6", text: "#374151" },
  SENT: { bg: "#dbeafe", text: "#1e40af" },
  NEGOTIATING: { bg: "#fef9c3", text: "#854d0e" },
  APPROVED: { bg: "#dcfce7", text: "#166534" },
  REJECTED: { bg: "#fecaca", text: "#991b1b" },
  EXPIRED: { bg: "#e5e7eb", text: "#374151" },
  CONVERTED: { bg: "#e0e7ff", text: "#3730a3" },
};

const DealerQuoteTemplate = ({ data, company }: { data: DealerQuote; company?: PdfCompanyInfo }) => {
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.DRAFT;

  return (
    <Document title={`Cotización - ${data.quoteNumber}`}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Cotizacion de Vehiculo"
          documentNumber={data.quoteNumber}
          date={formatDate(data.createdAt)}
          status={data.status}
          statusColor={badgeColor}
          type={data.validUntil ? `Valida hasta: ${formatDate(data.validUntil)}` : undefined}
        />

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>{data.customerName || data.customer?.name || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Documento:</Text>
                <Text style={styles.value}>{data.customerDocument || data.customer?.taxId || "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Teléfono:</Text>
                <Text style={styles.value}>{data.customerPhone || data.customer?.phone || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{data.customerEmail || data.customer?.email || "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehículo */}
        {data.dealerUnit && (
          <View style={styles.vehicleBox}>
            <Text style={styles.sectionTitle}>Vehículo Cotizado</Text>
            <View style={styles.grid2Col}>
              <View style={styles.col}>
                <View style={styles.row}>
                  <Text style={styles.label}>Marca / Modelo:</Text>
                  <Text style={styles.value}>{data.dealerUnit.brand.name} {data.dealerUnit.model?.name ?? ""}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>VIN:</Text>
                  <Text style={styles.value}>{data.dealerUnit.vin || "—"}</Text>
                </View>
              </View>
              <View style={styles.col}>
                <View style={styles.row}>
                  <Text style={styles.label}>Placa:</Text>
                  <Text style={styles.value}>{data.dealerUnit.plate || "—"}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Código unidad:</Text>
                  <Text style={styles.value}>{data.dealerUnit.code}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Precios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglose de Precios</Text>
          <View style={styles.totalsBox}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Precio lista:</Text>
              <Text style={styles.totalValue}>{formatAmount(data.listPrice, data.currency)}</Text>
            </View>
            {Number(data.discountPct) > 0 && (
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Descuento ({data.discountPct}%):</Text>
                <Text style={styles.totalValue}>-{formatAmount(data.discountAmount, data.currency)}</Text>
              </View>
            )}
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Precio ofrecido:</Text>
              <Text style={styles.totalValue}>{formatAmount(data.offeredPrice, data.currency)}</Text>
            </View>
            {Number(data.taxPct) > 0 && (
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Impuesto ({data.taxPct}%):</Text>
                <Text style={styles.totalValue}>{formatAmount(data.taxAmount, data.currency)}</Text>
              </View>
            )}
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.grandTotal}>{formatAmount(data.totalAmount, data.currency)}</Text>
            </View>
          </View>
        </View>

        {data.financingRequired && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Financiamiento Requerido</Text>
            <Text style={styles.valueFull}>El cliente solicitó opciones de financiamiento.</Text>
          </View>
        )}

        {data.paymentTerms && (
          <View style={styles.row}>
            <Text style={styles.label}>Términos de pago:</Text>
            <Text style={styles.value}>{data.paymentTerms}</Text>
          </View>
        )}

        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

        {/* Firmas */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>Vendedor</Text>
          <Text style={styles.signatureLine}>Cliente</Text>
        </View>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.quoteNumber}
        />
      </Page>
    </Document>
  );
};

export default DealerQuoteTemplate;
