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
  WorkshopQuotation,
  QuotationStatus,
} from "../interfaces/quotation.interface";

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
  approvedRow: { backgroundColor: "#dcfce7" },
  rejectedRow: { backgroundColor: "#fecaca" },
  pendingRow: { backgroundColor: "#fef9c3" },
});

const formatDate = (d?: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("es-VE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatAmount = (value: number | string | null, currency = "USD") => {
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
  PENDING_APPROVAL: { bg: "#fef9c3", text: "#854d0e" },
  APPROVED_TOTAL: { bg: "#dcfce7", text: "#166534" },
  APPROVED_PARTIAL: { bg: "#dcfce7", text: "#166534" },
  REJECTED: { bg: "#fecaca", text: "#991b1b" },
  EXPIRED: { bg: "#e5e7eb", text: "#374151" },
  CONVERTED: { bg: "#e0e7ff", text: "#3730a3" },
};

const approvalTypeLabel: Record<string, string> = {
  TOTAL: "Aprobación Total",
  PARTIAL: "Aprobación Parcial",
  REJECTION: "Rechazo",
};

const channelLabel: Record<string, string> = {
  PRESENTIAL: "Presencial",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  CALL: "Llamada",
  DIGITAL_SIGNATURE: "Firma Digital",
};

const QuotationTemplate = ({ data }: { data: WorkshopQuotation }) => {
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.DRAFT;

  const approvedItems = data.items.filter((i) => i.approved);
  const pendingItems = data.items.filter((i) => !i.approved);

  return (
    <Document title={`Cotización - ${data.quotationNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>Cotización de Taller</Text>
              <Text style={styles.headerSubtitle}>AutoSys</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerNumber}>{data.quotationNumber}</Text>
            {data.version > 1 && (
              <Text style={styles.headerDate}>Versión: {data.version}</Text>
            )}
            <Text style={styles.headerDate}>{formatDate(data.createdAt)}</Text>
            <Text
              style={[
                styles.badge,
                { backgroundColor: badgeColor.bg, color: badgeColor.text },
              ]}
            >
              {data.status}
            </Text>
            {data.validUntil && (
              <Text style={styles.headerDate}>Válida hasta: {formatDate(data.validUntil)}</Text>
            )}
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Cliente / Vehículo</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Cliente:</Text>
                <Text style={styles.value}>{data.customer?.name || "—"}</Text>
              </View>
              {data.customer?.code && (
                <View style={styles.row}>
                  <Text style={styles.label}>Cód.:</Text>
                  <Text style={styles.value}>{data.customer.code}</Text>
                </View>
              )}
            </View>
            <View style={styles.col}>
              {data.customerVehicle && (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>Vehículo:</Text>
                    <Text style={styles.value}>
                      {data.customerVehicle.brand?.name ?? ""} {data.customerVehicle.vehicleModel?.name ?? ""}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Placa:</Text>
                    <Text style={styles.value}>{data.customerVehicle.plate || "—"}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ítems Cotizados</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: "8%" }]}>Tipo</Text>
              <Text style={[styles.tableHeaderCell, { width: "32%" }]}>Descripción</Text>
              <Text style={[styles.tableHeaderCell, { width: "8%", textAlign: "center" }]}>Cant.</Text>
              <Text style={[styles.tableHeaderCell, { width: "12%", textAlign: "right" }]}>Precio</Text>
              <Text style={[styles.tableHeaderCell, { width: "8%", textAlign: "center" }]}>Desc.%</Text>
              <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "center" }]}>Imp.</Text>
              <Text style={[styles.tableHeaderCell, { width: "12%", textAlign: "right" }]}>Total</Text>
              <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "center" }]}>Est.</Text>
            </View>
            {data.items.map((line, idx) => (
              <View
                key={line.id}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 ? styles.tableRowAlt : {},
                  line.approved ? styles.approvedRow : styles.pendingRow,
                ]}
              >
                <Text style={[styles.tableCell, { width: "8%" }]}>{line.type}</Text>
                <Text style={[styles.tableCell, { width: "32%" }]}>{line.description}</Text>
                <Text style={[styles.tableCell, { width: "8%", textAlign: "center" }]}>
                  {line.quantity}
                </Text>
                <Text style={[styles.tableCell, { width: "12%", textAlign: "right" }]}>
                  {formatAmount(line.unitPrice, data.currency)}
                </Text>
                <Text style={[styles.tableCell, { width: "8%", textAlign: "center" }]}>
                  {Number(line.discountPct) > 0 ? `${line.discountPct}%` : "—"}
                </Text>
                <Text style={[styles.tableCell, { width: "10%", textAlign: "center" }]}>
                  {line.taxRate}%
                </Text>
                <Text style={[styles.tableCell, { width: "12%", textAlign: "right", fontFamily: "Roboto-Bold" }]}>
                  {formatAmount(line.total, data.currency)}
                </Text>
                <Text style={[styles.tableCell, { width: "10%", textAlign: "center" }]}>
                  {line.approved ? "Aprobado" : "Pend."}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.subtotal, data.currency)}</Text>
          </View>
          {Number(data.discount) > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Descuento:</Text>
              <Text style={styles.totalValue}>-{formatAmount(data.discount, data.currency)}</Text>
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

        {/* Aprobaciones */}
        {data.approvals && data.approvals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial de Aprobaciones</Text>
            {data.approvals.map((a) => (
              <View key={a.id} style={[styles.row, { marginBottom: 6 }]}>
                <Text style={[styles.valueFull, { marginBottom: 2 }]}>
                  {approvalTypeLabel[a.type] || a.type} — {channelLabel[a.channel] || a.channel}
                </Text>
                <Text style={styles.valueFull}>
                  Por: {a.approvedByName} | Fecha: {formatDate(a.approvedAt)}
                  {a.rejectionReason ? ` | Motivo: ${a.rejectionReason}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas para el cliente</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}
        {data.internalNotes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas internas</Text>
            <Text style={styles.valueFull}>{data.internalNotes}</Text>
          </View>
        )}

        {/* Suplementarias */}
        {data.supplementaries && data.supplementaries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cotizaciones Suplementarias</Text>
            {data.supplementaries.map((s, idx) => (
              <View key={idx} style={styles.row}>
                <Text style={styles.valueFull}>
                  {s.quotationNumber} — {formatDate(s.createdAt)} — {formatAmount(s.total ?? null, s.currency)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Firmas */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>Cliente</Text>
          <Text style={styles.signatureLine}>Asesor de Servicio</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>AutoSys</Text>
          <Text style={styles.footerText}>{data.quotationNumber}</Text>
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

export default QuotationTemplate;
