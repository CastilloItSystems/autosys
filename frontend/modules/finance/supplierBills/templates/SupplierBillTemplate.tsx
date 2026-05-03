import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import "@/utils/pdfUtils";
import type { SupplierBill } from "../interfaces/supplierBill";

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
  tableHeaderCell: { color: "#ffffff", fontFamily: "Roboto-Bold", fontSize: 8 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  tableCell: { fontSize: 8, color: "#334155" },
  totalsBox: { marginTop: 8, alignItems: "flex-end", gap: 3 },
  totalLine: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  totalLabel: { fontSize: 8, color: "#64748b", width: 100, textAlign: "right" },
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
  PENDING_INVOICE: "Pendiente por factura",
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING_INVOICE: { bg: "#fef9c3", text: "#854d0e" },
  PENDING: { bg: "#fef3c7", text: "#92400e" },
  PARTIAL: { bg: "#dbeafe", text: "#1e40af" },
  PAID: { bg: "#dcfce7", text: "#166534" },
  CANCELLED: { bg: "#f1f5f9", text: "#475569" },
};

const TAX_TYPE_LABELS: Record<string, string> = {
  IVA: "IVA",
  EXEMPT: "Exento",
  REDUCED: "Reducido",
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

const SupplierBillTemplate = ({ data }: { data: SupplierBill }) => {
  const badgeColor = STATUS_COLORS[data.status] ?? STATUS_COLORS.PENDING;
  const cur = data.currency ?? "USD";
  const items = data.items ?? [];

  return (
    <Document title={`Factura Proveedor - ${data.internalNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>Factura de Proveedor</Text>
              <Text style={styles.headerSubtitle}>AutoSys</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerNumber}>
              {data.billNumber ? data.billNumber : data.internalNumber}
            </Text>
            {data.billNumber ? (
              <Text style={styles.headerDate}>
                {`Int: ${data.internalNumber}`}
              </Text>
            ) : null}
            <Text style={styles.headerDate}>{formatDate(data.issueDate)}</Text>
            <Text
              style={[
                styles.badge,
                { backgroundColor: badgeColor.bg, color: badgeColor.text },
              ]}
            >
              {STATUS_LABELS[data.status] ?? data.status}
            </Text>
          </View>
        </View>

        {/* Datos del Proveedor y Documento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Proveedor</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Proveedor:</Text>
                <Text style={styles.value}>{data.supplier?.name ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>RIF / Tax ID:</Text>
                <Text style={styles.value}>{data.supplier?.taxId ?? "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>OC Asociada:</Text>
                <Text style={styles.value}>
                  {data.purchaseOrder?.orderNumber ?? "—"}
                </Text>
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
                <Text style={styles.label}>Vence:</Text>
                <Text style={styles.value}>{formatDate(data.dueDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalle de Items</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Item</Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: 40, textAlign: "center" },
                  ]}
                >
                  Cant.
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: 70, textAlign: "right" },
                  ]}
                >
                  Costo Unit.
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: 40, textAlign: "center" },
                  ]}
                >
                  Desc%
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: 50, textAlign: "center" },
                  ]}
                >
                  Impuesto
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: 60, textAlign: "right" },
                  ]}
                >
                  IVA
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: 70, textAlign: "right" },
                  ]}
                >
                  Total
                </Text>
              </View>
              {items.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 3 }]}>
                    {item.item?.name ?? item.itemName ?? "—"}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 40, textAlign: "center" },
                    ]}
                  >
                    {String(item.quantity)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 70, textAlign: "right" },
                    ]}
                  >
                    {formatAmount(item.unitCost, cur)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 40, textAlign: "center" },
                    ]}
                  >
                    {`${Number(item.discountPercent ?? 0)}%`}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 50, textAlign: "center" },
                    ]}
                  >
                    {`${TAX_TYPE_LABELS[item.taxType] ?? item.taxType} ${Number(item.taxRate ?? 0)}%`}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 60, textAlign: "right" },
                    ]}
                  >
                    {formatAmount(item.taxAmount, cur)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 70, textAlign: "right" },
                    ]}
                  >
                    {formatAmount(item.totalLine, cur)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.subtotal, cur)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>IVA:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.taxAmount, cur)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.grandTotal}>{formatAmount(data.total, cur)}</Text>
          </View>
          {Number(data.paidAmount) > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Pagado:</Text>
              <Text style={[styles.totalValue, { color: "#166534" }]}>
                {formatAmount(data.paidAmount, cur)}
              </Text>
            </View>
          )}
          {Number(data.pendingAmount) > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Pendiente:</Text>
              <Text style={[styles.totalValue, { color: "#b45309" }]}>
                {formatAmount(data.pendingAmount, cur)}
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Recibido por</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Autorizado por</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>AutoSys</Text>
          <Text style={styles.footerText}>{data.internalNumber}</Text>
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

export default SupplierBillTemplate;
