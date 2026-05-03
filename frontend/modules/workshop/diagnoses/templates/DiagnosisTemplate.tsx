import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import "@/utils/pdfUtils";
import { Diagnosis, DiagnosisStatus } from "../interfaces/diagnosis.interface";

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
  hiddenSection: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
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

const severityLabel: Record<string, string> = {
  LOW: "Bajo",
  MEDIUM: "Medio",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

const severityColors: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "#dcfce7", text: "#166534" },
  MEDIUM: { bg: "#fef9c3", text: "#854d0e" },
  HIGH: { bg: "#fed7aa", text: "#9a3412" },
  CRITICAL: { bg: "#fecaca", text: "#991b1b" },
};

const statusBadgeColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#f3f4f6", text: "#374151" },
  COMPLETED: { bg: "#dbeafe", text: "#1e40af" },
  APPROVED_INTERNAL: { bg: "#dcfce7", text: "#166534" },
};

const evidenceTypeLabel: Record<string, string> = {
  photo: "Foto",
  video: "Video",
  document: "Documento",
};

const DiagnosisTemplate = ({ data }: { data: Diagnosis }) => {
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.DRAFT;

  const visibleFindings = data.findings?.filter((f) => !f.isHiddenFinding) || [];
  const hiddenFindings = data.findings?.filter((f) => f.isHiddenFinding) || [];

  return (
    <Document title={`Diagnóstico - ${data.id}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>Reporte de Diagnóstico</Text>
              <Text style={styles.headerSubtitle}>AutoSys</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerNumber}>ID: {data.id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.headerDate}>{formatDate(data.createdAt)}</Text>
            <Text
              style={[
                styles.badge,
                { backgroundColor: badgeColor.bg, color: badgeColor.text },
              ]}
            >
              {data.status}
            </Text>
            {data.severity && (
              <Text style={styles.headerDate}>
                Severidad: {severityLabel[data.severity] || data.severity}
              </Text>
            )}
          </View>
        </View>

        {/* Técnico y Órdenes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificación</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Técnico:</Text>
                <Text style={styles.value}>{data.technician?.name || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Inicio:</Text>
                <Text style={styles.value}>{formatDate(data.startedAt)}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Orden de servicio:</Text>
                <Text style={styles.value}>{data.serviceOrder?.folio || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Fin:</Text>
                <Text style={styles.value}>{formatDate(data.finishedAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Hallazgos */}
        {visibleFindings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hallazgos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Categoría</Text>
                <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Descripción</Text>
                <Text style={[styles.tableHeaderCell, { width: "12%", textAlign: "center" }]}>Severidad</Text>
                <Text style={[styles.tableHeaderCell, { width: "14%", textAlign: "center" }]}>Req. Autorización</Text>
                <Text style={[styles.tableHeaderCell, { width: "14%", textAlign: "center" }]}>Aprob. Cliente</Text>
                <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Notas</Text>
              </View>
              {visibleFindings.map((f, idx) => {
                const sevColor = severityColors[f.severity] || severityColors.MEDIUM;
                return (
                  <View
                    key={f.id}
                    style={[
                      styles.tableRow,
                      idx % 2 === 1 ? styles.tableRowAlt : {},
                    ]}
                  >
                    <Text style={[styles.tableCell, { width: "20%" }]}>{f.category || "—"}</Text>
                    <Text style={[styles.tableCell, { width: "30%" }]}>{f.description}</Text>
                    <Text
                      style={[
                        styles.tableCell,
                        {
                          width: "12%",
                          textAlign: "center",
                          backgroundColor: sevColor.bg,
                          color: sevColor.text,
                          borderRadius: 2,
                        },
                      ]}
                    >
                      {severityLabel[f.severity] || f.severity}
                    </Text>
                    <Text style={[styles.tableCell, { width: "14%", textAlign: "center" }]}>
                      {f.requiresClientAuth ? "Sí" : "No"}
                    </Text>
                    <Text style={[styles.tableCell, { width: "14%", textAlign: "center" }]}>
                      {f.clientApproved === true ? "Sí" : f.clientApproved === false ? "No" : "N/A"}
                    </Text>
                    <Text style={[styles.tableCell, { width: "10%" }]}>
                      {f.observation || "—"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Hallazgos ocultos */}
        {hiddenFindings.length > 0 && (
          <View style={styles.hiddenSection}>
            <Text style={[styles.sectionTitle, { color: "#991b1b", borderLeftColor: "#ef4444" }]}>
              Hallazgos Ocultos
            </Text>
            {hiddenFindings.map((f) => (
              <View key={f.id} style={styles.row}>
                <Text style={styles.valueFull}>
                  {f.category ? `[${f.category}] ` : ""}{f.description} — Severidad: {severityLabel[f.severity] || f.severity}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Operaciones sugeridas */}
        {data.suggestedOperations && data.suggestedOperations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operaciones Sugeridas</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "60%" }]}>Descripción</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%", textAlign: "center" }]}>Tiempo Est.</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Precio Est.</Text>
              </View>
              {data.suggestedOperations.map((op, idx) => (
                <View key={op.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { width: "60%" }]}>{op.description}</Text>
                  <Text style={[styles.tableCell, { width: "20%", textAlign: "center" }]}>
                    {op.estimatedMins ? `${op.estimatedMins} min` : "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
                    {op.estimatedPrice ? `$${op.estimatedPrice}` : "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Repuestos sugeridos */}
        {data.suggestedParts && data.suggestedParts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Repuestos Sugeridos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "50%" }]}>Descripción</Text>
                <Text style={[styles.tableHeaderCell, { width: "16%", textAlign: "center" }]}>Cantidad</Text>
                <Text style={[styles.tableHeaderCell, { width: "17%", textAlign: "right" }]}>Costo Est.</Text>
                <Text style={[styles.tableHeaderCell, { width: "17%", textAlign: "right" }]}>Precio Est.</Text>
              </View>
              {data.suggestedParts.map((part, idx) => (
                <View key={part.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { width: "50%" }]}>{part.description}</Text>
                  <Text style={[styles.tableCell, { width: "16%", textAlign: "center" }]}>
                    {part.quantity || "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "17%", textAlign: "right" }]}>
                    {part.estimatedCost ? `$${part.estimatedCost}` : "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "17%", textAlign: "right" }]}>
                    {part.estimatedPrice ? `$${part.estimatedPrice}` : "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Evidencias */}
        {data.evidences && data.evidences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidencias</Text>
            {data.evidences.map((ev) => (
              <View key={ev.id} style={styles.row}>
                <Text style={styles.valueFull}>
                  {evidenceTypeLabel[ev.type] || ev.type}: {ev.description || ev.url}
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.generalNotes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas Generales</Text>
            <Text style={styles.valueFull}>{data.generalNotes}</Text>
          </View>
        )}

        {/* Firmas */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>Técnico</Text>
          <Text style={styles.signatureLine}>Autorización Cliente</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>AutoSys</Text>
          <Text style={styles.footerText}>Diagnóstico #{data.id.slice(-8).toUpperCase()}</Text>
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

export default DiagnosisTemplate;
