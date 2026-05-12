import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import PdfDocumentHeader from "@/components/pdf/PdfDocumentHeader";
import PdfDocumentFooter from "@/components/pdf/PdfDocumentFooter";
import type { PdfCompanyInfo } from "@/components/pdf/pdfCompany";
import "@/utils/pdfUtils";
import type { WorkshopRework, ReworkStatus } from "../interfaces/rework.interface";

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

const STATUS_COLORS: Record<ReworkStatus, { bg: string; text: string }> = {
  OPEN: { bg: "#dbeafe", text: "#1e40af" },
  IN_PROGRESS: { bg: "#fef9c3", text: "#854d0e" },
  RESOLVED: { bg: "#dcfce7", text: "#166534" },
  CLOSED: { bg: "#f1f5f9", text: "#475569" },
};

const STATUS_LABELS: Record<ReworkStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En Proceso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
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

const ReworkTemplate = ({ data, company }: { data: WorkshopRework; company?: PdfCompanyInfo }) => {
  const badgeColor = STATUS_COLORS[data.status] ?? STATUS_COLORS.OPEN;
  const shortId = data.id.slice(0, 8).toUpperCase();
  const variance =
    data.realCost != null
      ? data.realCost - data.estimatedCost
      : null;

  return (
    <Document title={"Retrabajo - " + shortId}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Retrabajo"
          documentNumber={`#${shortId}`}
          date={formatDate(data.createdAt)}
          status={STATUS_LABELS[data.status]}
          statusColor={badgeColor}
        />

        {/* Órdenes */}
        <View style={[styles.section, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Órdenes de Trabajo</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>OT Original:</Text>
                <Text style={styles.value}>{data.originalOrder?.folio ?? "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>OT Retrabajo:</Text>
                <Text style={styles.value}>{data.reworkOrder?.folio ?? "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Motivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motivo</Text>
          <Text style={styles.textBlock}>{data.motive}</Text>
        </View>

        {/* Causa raíz */}
        {data.rootCause && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Causa Raíz</Text>
            <Text style={styles.textBlock}>{data.rootCause}</Text>
          </View>
        )}

        {/* Técnico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asignación</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Técnico asignado:</Text>
            <Text style={styles.value}>{data.technicianId ?? "—"}</Text>
          </View>
        </View>

        {/* Financiero */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Costos</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Costo estimado:</Text>
                <Text style={styles.value}>{formatAmount(data.estimatedCost)}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Costo real:</Text>
                <Text style={styles.value}>{formatAmount(data.realCost)}</Text>
              </View>
              {variance != null && (
                <View style={styles.row}>
                  <Text style={styles.label}>Variación:</Text>
                  <Text style={[styles.value, { color: variance > 0 ? "#dc2626" : "#16a34a" }]}>
                    {(variance > 0 ? "+" : "") + formatAmount(variance)}
                  </Text>
                </View>
              )}
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

        {/* Fechas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fechas</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Creado el:</Text>
                <Text style={styles.value}>{formatDate(data.createdAt)}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Resuelto el:</Text>
                <Text style={styles.value}>{formatDate(data.resolvedAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Firmas */}
        <View style={[styles.signatureArea, { marginTop: 30 }]}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Reportado por</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Técnico</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Supervisor</Text>
          </View>
        </View>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={`#${shortId}`}
        />
      </Page>
    </Document>
  );
};

export default ReworkTemplate;
