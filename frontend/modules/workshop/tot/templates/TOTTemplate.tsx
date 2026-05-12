import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import PdfDocumentHeader from "@/components/pdf/PdfDocumentHeader";
import PdfDocumentFooter from "@/components/pdf/PdfDocumentFooter";
import type { PdfCompanyInfo } from "@/components/pdf/pdfCompany";
import "@/utils/pdfUtils";
import type { WorkshopTOT, TOTStatus } from "../interfaces/tot.interface";

const styles = StyleSheet.create({
  page: { paddingTop: 88, paddingBottom: 50, paddingHorizontal: 30, fontFamily: "Roboto" },
  header: { position: "absolute", top: 20, left: 30, right: 30, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 2, borderBottomColor: "#1e3a8a", paddingBottom: 8 },
  footer: { position: "absolute", bottom: 20, left: 30, right: 30, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94a3b8" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontFamily: "Roboto-Bold", color: "#1e3a8a", borderLeftWidth: 3, borderLeftColor: "#3b82f6", paddingLeft: 6, marginBottom: 6 },
  grid2Col: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { fontSize: 8, color: "#6b7280", width: 110 },
  value: { fontSize: 8, flex: 1 },
  signatureArea: { flexDirection: "row", justifyContent: "space-around", marginTop: 24 },
  signatureBox: { alignItems: "center", width: 140 },
  signatureLine: { borderTopWidth: 1, borderTopColor: "#374151", width: 120, marginBottom: 3 },
  signatureLabel: { fontSize: 7, color: "#6b7280" },
  headerLeft: { flexDirection: "column" },
  headerTitle: { fontSize: 13, fontFamily: "Roboto-Bold", color: "#0f172a" },
  headerSubtitle: { fontSize: 8, color: "#64748b", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  headerNumber: { fontSize: 12, fontFamily: "Roboto-Bold", color: "#1e3a8a" },
  headerDate: { fontSize: 8, color: "#64748b", marginTop: 2 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 8, fontFamily: "Roboto-Bold", alignSelf: "flex-end", marginTop: 4 },
  textBlock: { fontSize: 8, lineHeight: 1.4, color: "#1e293b" },
  totalsBox: { marginTop: 8, alignItems: "flex-end", gap: 3 },
  totalLine: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  totalLabel: { fontSize: 8, color: "#64748b", width: 120, textAlign: "right" },
  totalValue: { fontSize: 8, color: "#1e293b", width: 90, textAlign: "right" },
  grandTotal: { fontSize: 10, color: "#1e3a8a", fontFamily: "Roboto-Bold", width: 90, textAlign: "right" },
});

const STATUS_COLORS: Record<TOTStatus, { bg: string; text: string }> = {
  REQUESTED: { bg: "#dbeafe", text: "#1e40af" },
  APPROVED: { bg: "#dcfce7", text: "#166534" },
  DEPARTED: { bg: "#fef9c3", text: "#854d0e" },
  IN_PROGRESS: { bg: "#fde68a", text: "#92400e" },
  RETURNED: { bg: "#e0f2fe", text: "#0369a1" },
  INVOICED: { bg: "#f0fdf4", text: "#15803d" },
  CANCELLED: { bg: "#fecaca", text: "#991b1b" },
};

const STATUS_LABELS: Record<TOTStatus, string> = {
  REQUESTED: "Solicitado",
  APPROVED: "Aprobado",
  DEPARTED: "Enviado",
  IN_PROGRESS: "En Proceso",
  RETURNED: "Retornado",
  INVOICED: "Facturado",
  CANCELLED: "Cancelado",
};

const TAX_TYPE_LABELS: Record<string, string> = {
  IVA: "IVA",
  EXEMPT: "Exento",
  REDUCED: "Reducido",
};

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(d);
  }
};

const formatAmount = (v?: number | null) =>
  v != null ? v.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

const TOTTemplate = ({ data, company }: { data: WorkshopTOT; company?: PdfCompanyInfo }) => {
  const badgeColor = STATUS_COLORS[data.status] ?? STATUS_COLORS.REQUESTED;
  const providerDisplay = data.supplier?.name ?? data.providerName ?? "—";
  const providerPhone = data.supplier?.phone ?? "—";

  return (
    <Document title={"TOT - " + data.totNumber}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Trabajo Externo (T.O.T.)"
          documentNumber={data.totNumber}
          date={formatDate(data.createdAt)}
          status={STATUS_LABELS[data.status]}
          statusColor={badgeColor}
        />

        {/* Orden de Servicio y Proveedor */}
        <View style={[styles.section, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Información General</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Orden de Servicio:</Text>
                <Text style={styles.value}>{data.serviceOrder?.folio ?? data.serviceOrderId.slice(0, 8) + "..."}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Proveedor:</Text>
                <Text style={styles.value}>{providerDisplay}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Teléfono:</Text>
                <Text style={styles.value}>{providerPhone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pieza */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pieza / Componente</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Descripción:</Text>
                <Text style={styles.value}>{data.partDescription}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Serial:</Text>
                <Text style={styles.value}>{data.partSerial ?? "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Cantidad:</Text>
                <Text style={styles.value}>{String(data.quantity)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trabajo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trabajo Solicitado</Text>
          <Text style={styles.textBlock}>{data.requestedWork}</Text>
          {data.technicalInstruction && (
            <View style={{ marginTop: 6 }}>
              <View style={styles.row}>
                <Text style={styles.label}>Instrucción técnica:</Text>
                <Text style={[styles.value, { lineHeight: 1.4 }]}>{data.technicalInstruction}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Fechas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fechas de Seguimiento</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Fecha de salida:</Text>
                <Text style={styles.value}>{formatDate(data.departedAt)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Retorno estimado:</Text>
                <Text style={styles.value}>{formatDate(data.estimatedReturnAt)}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Fecha de retorno:</Text>
                <Text style={styles.value}>{formatDate(data.returnedAt)}</Text>
              </View>
              {data.departureRef && (
                <View style={styles.row}>
                  <Text style={styles.label}>Ref. salida:</Text>
                  <Text style={styles.value}>{data.departureRef}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Financiero */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Financiera</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Presupuesto proveedor:</Text>
                <Text style={styles.value}>{formatAmount(data.providerQuote)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Costo final:</Text>
                <Text style={styles.value}>{formatAmount(data.finalCost)}</Text>
              </View>
              {data.providerInvoiceRef && (
                <View style={styles.row}>
                  <Text style={styles.label}>Factura prov.:</Text>
                  <Text style={styles.value}>{data.providerInvoiceRef}</Text>
                </View>
              )}
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Precio cliente:</Text>
                <Text style={styles.value}>{formatAmount(data.clientPrice)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Descuento:</Text>
                <Text style={styles.value}>{String(data.discountPct)}%</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Impuesto ({TAX_TYPE_LABELS[data.taxType] ?? data.taxType}):</Text>
                <Text style={styles.value}>{String(data.taxRate)}% = {formatAmount(data.taxAmount)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.grandTotal}>{formatAmount(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Notas */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.textBlock}>{data.notes}</Text>
          </View>
        )}

        {/* Firmas */}
        <View style={[styles.signatureArea, { marginTop: 30 }]}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Solicitado por</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Proveedor</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Aprobado por</Text>
          </View>
        </View>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.totNumber}
        />
      </Page>
    </Document>
  );
};

export default TOTTemplate;
