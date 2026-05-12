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
import {
  EntryNote,
  ENTRY_NOTE_STATUS_CONFIG,
  ENTRY_TYPE_LABELS,
} from "../interfaces/entryNote.interface";

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
  PENDING: { bg: "#fef9c3", text: "#854d0e" },
  IN_PROGRESS: { bg: "#dbeafe", text: "#1e40af" },
  COMPLETED: { bg: "#dcfce7", text: "#166534" },
  CANCELLED: { bg: "#fecaca", text: "#991b1b" },
};

const EntryNoteTemplate = ({ data, company }: { data: EntryNote; company?: PdfCompanyInfo }) => {
  const cfg = ENTRY_NOTE_STATUS_CONFIG[data.status];
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.PENDING;

  return (
    <Document title={`Nota de Entrada - ${data.entryNoteNumber}`}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Nota de Entrada"
          documentNumber={data.entryNoteNumber}
          date={formatDate(data.receivedAt || data.createdAt)}
          status={cfg?.label || data.status}
          statusColor={badgeColor}
          type={ENTRY_TYPE_LABELS[data.type] || data.type}
        />

        {/* Almacén y Proveedor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Origen y Destino</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Almacén:</Text>
                <Text style={styles.value}>{data.warehouse?.name || "—"} ({data.warehouse?.code || ""})</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Proveedor:</Text>
                <Text style={styles.value}>
                  {data.supplierName || data.catalogSupplier?.name || "—"}
                </Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Referencia:</Text>
                <Text style={styles.value}>{data.reference || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Motivo:</Text>
                <Text style={styles.value}>{data.reason || "—"}</Text>
              </View>
              {data.purchaseOrder && (
                <View style={styles.row}>
                  <Text style={styles.label}>OC asociada:</Text>
                  <Text style={styles.value}>{data.purchaseOrder.orderNumber}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Items */}
        {data.items && data.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artículos Recibidos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "32%" }]}>Artículo</Text>
                <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "center" }]}>Cantidad</Text>
                <Text style={[styles.tableHeaderCell, { width: "14%", textAlign: "right" }]}>Costo</Text>
                <Text style={[styles.tableHeaderCell, { width: "14%" }]}>Lote</Text>
                <Text style={[styles.tableHeaderCell, { width: "14%" }]}>Vencimiento</Text>
                <Text style={[styles.tableHeaderCell, { width: "16%" }]}>Ubicación</Text>
              </View>
              {data.items.map((line, idx) => (
                <View
                  key={line.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { width: "32%" }]}>
                    {line.itemName || line.item?.name || "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "10%", textAlign: "center" }]}>
                    {line.quantityReceived}
                  </Text>
                  <Text style={[styles.tableCell, { width: "14%", textAlign: "right" }]}>
                    {line.unitCost ? `$${line.unitCost.toFixed(2)}` : "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "14%" }]}>
                    {line.batchNumber || "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "14%" }]}>
                    {line.expiryDate ? formatDate(line.expiryDate) : "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "16%" }]}>
                    {line.storedToLocation || "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Responsables */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsables</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Recibido por:</Text>
                <Text style={styles.value}>{data.receivedByName || data.receivedBy || "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Verificado por:</Text>
                <Text style={styles.value}>{data.verifiedByName || data.verifiedBy || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Autorizado por:</Text>
                <Text style={styles.value}>{data.authorizedByName || data.authorizedBy || "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

        {/* Firmas */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>Recibió</Text>
          <Text style={styles.signatureLine}>Verificó</Text>
          <Text style={styles.signatureLine}>Autorizó</Text>
        </View>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.entryNoteNumber}
        />
      </Page>
    </Document>
  );
};

export default EntryNoteTemplate;
