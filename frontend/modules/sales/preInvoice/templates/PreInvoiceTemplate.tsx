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
  PreInvoice,
  PreInvoiceStatus,
  PREINVOICE_STATUS_CONFIG,
} from "../interfaces/preInvoice.interface";

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

const statusBadgeColors: Record<string, { bg: string; text: string }> = {
  PENDING_PREPARATION: { bg: "#fef9c3", text: "#854d0e" },
  IN_PREPARATION: { bg: "#dbeafe", text: "#1e40af" },
  READY_FOR_PAYMENT: { bg: "#f3e8ff", text: "#6b21a8" },
  PAID: { bg: "#dcfce7", text: "#166534" },
  CANCELLED: { bg: "#fecaca", text: "#991b1b" },
};

const taxLabel = (taxType?: string | null) => {
  if (taxType === "EXEMPT") return "Exento";
  if (taxType === "REDUCED") return "Red. 8%";
  return "IVA 16%";
};

const PreInvoiceTemplate = ({ data }: { data: PreInvoice }) => {
  const cfg = PREINVOICE_STATUS_CONFIG[data.status];
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.PENDING_PREPARATION;

  return (
    <Document title={`Pre-Factura - ${data.preInvoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>Pre-Factura</Text>
              <Text style={styles.headerSubtitle}>AutoSys</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerNumber}>{data.preInvoiceNumber}</Text>
            <Text style={styles.headerDate}>{formatDate(data.createdAt)}</Text>
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
              {data.customer?.phone && (
                <View style={styles.row}>
                  <Text style={styles.label}>Teléfono:</Text>
                  <Text style={styles.value}>{data.customer.phone}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Orden asociada */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Origen</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              {data.order && (
                <View style={styles.row}>
                  <Text style={styles.label}>Orden de venta:</Text>
                  <Text style={styles.value}>{data.order.orderNumber}</Text>
                </View>
              )}
              {data.serviceOrder && (
                <View style={styles.row}>
                  <Text style={styles.label}>Orden de servicio:</Text>
                  <Text style={styles.value}>{data.serviceOrder.folio}</Text>
                </View>
              )}
              {data.consolidatedServiceOrders && data.consolidatedServiceOrders.length > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>OTs consolidadas:</Text>
                  <Text style={styles.value}>
                    {data.consolidatedServiceOrders.map((s) => s.folio).join(", ")}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Almacén:</Text>
                <Text style={styles.value}>{data.warehouse?.name || (data.serviceOrderId ? "Taller" : "—")}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Artículos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: "28%" }]}>Artículo</Text>
              <Text style={[styles.tableHeaderCell, { width: "8%", textAlign: "center" }]}>Cant.</Text>
              <Text style={[styles.tableHeaderCell, { width: "14%", textAlign: "right" }]}>Precio</Text>
              <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "center" }]}>Desc.%</Text>
              <Text style={[styles.tableHeaderCell, { width: "12%", textAlign: "center" }]}>Impuesto</Text>
              <Text style={[styles.tableHeaderCell, { width: "14%", textAlign: "right" }]}>Total Línea</Text>
            </View>
            {(data.items ?? []).map((line, idx) => (
              <View
                key={line.id}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 ? styles.tableRowAlt : {},
                ]}
              >
                <Text style={[styles.tableCell, { width: "28%" }]}>
                  {line.itemName || line.item?.name || "—"}
                </Text>
                <Text style={[styles.tableCell, { width: "8%", textAlign: "center" }]}>
                  {line.quantity}
                </Text>
                <Text style={[styles.tableCell, { width: "14%", textAlign: "right" }]}>
                  {formatAmount(line.unitPrice, data.currency)}
                </Text>
                <Text style={[styles.tableCell, { width: "10%", textAlign: "center" }]}>
                  {Number(line.discountPercent) > 0 ? `${line.discountPercent}%` : "—"}
                </Text>
                <Text style={[styles.tableCell, { width: "12%", textAlign: "center" }]}>
                  {taxLabel(line.taxType)}
                </Text>
                <Text style={[styles.tableCell, { width: "14%", textAlign: "right", fontFamily: "Roboto-Bold" }]}>
                  {formatAmount(line.totalLine, data.currency)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal bruto:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.subtotalBruto, data.currency)}</Text>
          </View>
          {Number(data.discountAmount) > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Descuento:</Text>
              <Text style={styles.totalValue}>-{formatAmount(data.discountAmount, data.currency)}</Text>
            </View>
          )}
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Base imponible:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.baseImponible, data.currency)}</Text>
          </View>
          {Number(data.baseExenta) > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Base exenta:</Text>
              <Text style={styles.totalValue}>{formatAmount(data.baseExenta, data.currency)}</Text>
            </View>
          )}
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>IVA ({data.taxRate}%):</Text>
            <Text style={styles.totalValue}>{formatAmount(data.taxAmount, data.currency)}</Text>
          </View>
          {data.igtfApplies && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>IGTF:</Text>
              <Text style={styles.totalValue}>{formatAmount(data.igtfAmount, data.currency)}</Text>
            </View>
          )}
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.grandTotal}>{formatAmount(data.total, data.currency)}</Text>
          </View>
          {data.exchangeRate && (
            <Text style={{ fontSize: 7, color: "#94a3b8", marginTop: 2 }}>
              Tasa: 1 {data.currency === "VES" ? "USD" : data.currency} = Bs. {Number(data.exchangeRate).toFixed(4)}
            </Text>
          )}
        </View>

        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

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

export default PreInvoiceTemplate;
