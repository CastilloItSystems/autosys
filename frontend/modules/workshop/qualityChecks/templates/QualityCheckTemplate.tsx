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
import { QualityCheck, QualityCheckStatus } from "../interfaces/qualityCheck.interface";

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
  passedRow: { backgroundColor: "#dcfce7" },
  failedRow: { backgroundColor: "#fecaca" },
  tableCell: { fontSize: 8, color: "#334155" },
  summaryBox: {
    marginTop: 8,
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  summaryItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    fontSize: 9,
    fontFamily: "Roboto-Bold",
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
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusBadgeColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#f3f4f6", text: "#374151" },
  IN_PROGRESS: { bg: "#fef9c3", text: "#854d0e" },
  PASSED: { bg: "#dcfce7", text: "#166534" },
  FAILED: { bg: "#fecaca", text: "#991b1b" },
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En revisión",
  PASSED: "Aprobado",
  FAILED: "Fallido",
};

const QualityCheckTemplate = ({ data, company }: { data: QualityCheck; company?: PdfCompanyInfo }) => {
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.PENDING;

  return (
    <Document title={`Chequeo de Calidad - ${data.id}`}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Chequeo de Calidad"
          documentNumber={`ID: ${data.id.slice(-8).toUpperCase()}`}
          date={formatDate(data.createdAt)}
          status={statusLabel[data.status] || data.status}
          statusColor={badgeColor}
        />

        {/* Info general */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Orden de servicio:</Text>
                <Text style={styles.value}>{data.serviceOrder?.folio || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Inspector:</Text>
                <Text style={styles.value}>{data.inspector?.nombre || "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Inicio:</Text>
                <Text style={styles.value}>{formatDate(data.startedAt)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Compleción:</Text>
                <Text style={styles.value}>{formatDate(data.completedAt)}</Text>
              </View>
              {data.retryCount > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>Reintentos:</Text>
                  <Text style={styles.value}>{data.retryCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Checklist */}
        {data.checklistItems && data.checklistItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checklist de Inspección</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "60%" }]}>Pregunta</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "center" }]}>Resultado</Text>
                <Text style={[styles.tableHeaderCell, { width: "25%" }]}>Observaciones</Text>
              </View>
              {data.checklistItems.map((item, idx) => (
                <View
                  key={item.key}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                    item.passed ? styles.passedRow : styles.failedRow,
                  ]}
                >
                  <Text style={[styles.tableCell, { width: "60%" }]}>{item.label}</Text>
                  <Text style={[styles.tableCell, { width: "15%", textAlign: "center", fontFamily: "Roboto-Bold" }]}>
                    {item.passed ? "PASS" : "FAIL"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "25%" }]}>
                    {item.notes || "—"}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.summaryBox}>
              <View style={[styles.summaryItem, { backgroundColor: "#dcfce7", color: "#166534" }]}>
                PASS: {data.passedItems}
              </View>
              <View style={[styles.summaryItem, { backgroundColor: "#fecaca", color: "#991b1b" }]}>
                FAIL: {data.failedItems}
              </View>
              <View style={[styles.summaryItem, { backgroundColor: "#dbeafe", color: "#1e40af" }]}>
                Total: {data.totalItems}
              </View>
            </View>
          </View>
        )}

        {data.failureNotes && (
          <View style={[styles.notesBox, { backgroundColor: "#fef2f2" }]}>
            <Text style={[styles.notesLabel, { color: "#991b1b" }]}>Notas de Fallos</Text>
            <Text style={styles.valueFull}>{data.failureNotes}</Text>
          </View>
        )}

        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas Adicionales</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

        {/* Decisión */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Decisión Final</Text>
          <View style={styles.row}>
            <Text style={[styles.valueFull, { fontSize: 11, fontFamily: "Roboto-Bold", color: data.status === "PASSED" ? "#166534" : data.status === "FAILED" ? "#991b1b" : "#1e40af" }]}>
              {data.status === "PASSED" ? "APROBADO (PASSED)" : data.status === "FAILED" ? "RECHAZADO (FAILED)" : data.status === "IN_PROGRESS" ? "EN REVISIÓN (IN PROGRESS)" : "PENDIENTE (PENDING)"}
            </Text>
          </View>
        </View>

        {/* Firma */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>Inspector de Calidad</Text>
        </View>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={`QC #${data.id.slice(-8).toUpperCase()}`}
        />
      </Page>
    </Document>
  );
};

export default QualityCheckTemplate;
