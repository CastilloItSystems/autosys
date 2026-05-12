import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import PdfDocumentHeader from "@/components/pdf/PdfDocumentHeader";
import PdfDocumentFooter from "@/components/pdf/PdfDocumentFooter";
import type { PdfCompanyInfo } from "@/components/pdf/pdfCompany";
import "@/utils/pdfUtils";
import type { Expense } from "../interfaces/expense";
import { EXPENSE_CATEGORY_LABELS } from "../interfaces/expense";

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
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 8,
  },
  totalsBox: { marginTop: 8, alignItems: "flex-end", gap: 3 },
  totalLine: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  totalLabel: { fontSize: 8, color: "#64748b", width: 130, textAlign: "right" },
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
  pendingValue: {
    fontSize: 9,
    color: "#ea580c",
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
  signatureArea: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 24,
  },
  signatureBox: { alignItems: "center", width: 140 },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#374151",
    width: 120,
    marginBottom: 3,
  },
  signatureLabel: { fontSize: 7, color: "#6b7280" },
  recurringBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  recurringText: {
    fontSize: 7,
    color: "#1e40af",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
});

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#f1f5f9", text: "#475569" },
  PENDING: { bg: "#fef9c3", text: "#854d0e" },
  PAID: { bg: "#dcfce7", text: "#166534" },
  CANCELLED: { bg: "#f1f5f9", text: "#475569" },
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
  const sym: Record<string, string> = { USD: "$", EUR: "€", VES: "Bs." };
  const s = sym[currency] ?? currency;
  return `${s} ${Number(value).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const ExpenseTemplate = ({ data, company }: { data: Expense; company?: PdfCompanyInfo }) => {
  const badgeColor = STATUS_COLORS[data.status] ?? STATUS_COLORS.PENDING;
  const cur = data.currency ?? "USD";
  const hasTax = Number(data.taxAmount) > 0;
  const hasPending = Number(data.pendingAmount) > 0;

  return (
    <Document title={`Gasto Operativo - ${data.expenseNumber}`}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Comprobante de Gasto Operativo"
          documentNumber={data.expenseNumber}
          date={formatDate(data.expenseDate)}
          status={STATUS_LABELS[data.status] ?? data.status}
          statusColor={badgeColor}
        />

        {/* ── Detalles del gasto ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Gasto</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Categoría:</Text>
                <Text style={styles.value}>
                  {EXPENSE_CATEGORY_LABELS[data.category] ?? data.category}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Fecha:</Text>
                <Text style={styles.value}>{formatDate(data.expenseDate)}</Text>
              </View>
              {data.supplier && (
                <View style={styles.row}>
                  <Text style={styles.label}>Proveedor:</Text>
                  <Text style={styles.value}>{data.supplier.name}</Text>
                </View>
              )}
              {data.isRecurring && (
                <View style={styles.row}>
                  <Text style={styles.label}>Tipo:</Text>
                  <Text style={[styles.value, { color: "#1e40af" }]}>
                    Recurrente{data.recurringRule ? ` — ${data.recurringRule.name}` : ""}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Moneda:</Text>
                <Text style={styles.value}>{cur}</Text>
              </View>
              {data.exchangeRate != null && data.currency !== "USD" && (
                <View style={styles.row}>
                  <Text style={styles.label}>Tasa de Cambio:</Text>
                  <Text style={styles.value}>{String(data.exchangeRate)}</Text>
                </View>
              )}
              {data.bankAccount && (
                <View style={styles.row}>
                  <Text style={styles.label}>Cuenta Bancaria:</Text>
                  <Text style={styles.value}>{data.bankAccount.name}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Registro:</Text>
                <Text style={styles.value}>{formatDate(data.createdAt)}</Text>
              </View>
            </View>
          </View>

          {/* Descripción */}
          {data.description && (
            <View style={[styles.row, { marginTop: 4 }]}>
              <Text style={styles.label}>Descripción:</Text>
              <Text style={[styles.valueFull, { width: "60%" }]}>
                {data.description}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* ── Montos ── */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.amount, cur)}</Text>
          </View>
          {hasTax && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Impuesto:</Text>
              <Text style={styles.totalValue}>
                {formatAmount(data.taxAmount, cur)}
              </Text>
            </View>
          )}
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.grandTotal}>{formatAmount(data.total, cur)}</Text>
          </View>
          {Number(data.paidAmount) > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Pagado:</Text>
              <Text style={styles.totalValue}>
                {formatAmount(data.paidAmount, cur)}
              </Text>
            </View>
          )}
          {hasPending && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Saldo Pendiente:</Text>
              <Text style={styles.pendingValue}>
                {formatAmount(data.pendingAmount, cur)}
              </Text>
            </View>
          )}
        </View>

        {/* ── Notas ── */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

        {/* ── Firmas ── */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Elaborado por</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Autorizado por</Text>
          </View>
        </View>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.expenseNumber}
        />
      </Page>
    </Document>
  );
};

export default ExpenseTemplate;
