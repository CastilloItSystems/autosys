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
  ServiceOrder,
  ServiceOrderStatus,
} from "../interfaces/serviceOrder.interface";

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

const formatAmount = (value: number | string | null, currency = "USD") => {
  const sym = { USD: "$", EUR: "€", VES: "Bs." }[currency] ?? "$";
  return `${sym} ${Number(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const statusBadgeColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#f3f4f6", text: "#374151" },
  OPEN: { bg: "#dbeafe", text: "#1e40af" },
  DIAGNOSING: { bg: "#fef9c3", text: "#854d0e" },
  PENDING_APPROVAL: { bg: "#fef9c3", text: "#854d0e" },
  APPROVED: { bg: "#dcfce7", text: "#166534" },
  IN_PROGRESS: { bg: "#dbeafe", text: "#1e40af" },
  READY: { bg: "#dcfce7", text: "#166534" },
  DELIVERED: { bg: "#d1fae5", text: "#065f46" },
  INVOICED: { bg: "#e0e7ff", text: "#3730a3" },
  CLOSED: { bg: "#f3f4f6", text: "#374151" },
  CANCELLED: { bg: "#fecaca", text: "#991b1b" },
};

const priorityLabel: Record<string, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  ASAP: "Urgente",
};

const ServiceOrderTemplate = ({ data, company }: { data: ServiceOrder; company?: PdfCompanyInfo }) => {
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.OPEN;

  return (
    <Document title={`Orden de Servicio - ${data.folio}`}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Orden de Servicio"
          documentNumber={data.folio}
          date={formatDate(data.receivedAt)}
          status={data.status}
          statusColor={badgeColor}
          type={`Prioridad: ${priorityLabel[data.priority] || data.priority}`}
        />

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>{data.customer?.name || "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Vehículo</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Placa:</Text>
                <Text style={styles.value}>{data.vehiclePlate || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Descripción:</Text>
                <Text style={styles.value}>{data.vehicleDesc || "—"}</Text>
              </View>
              {data.mileageIn != null && (
                <View style={styles.row}>
                  <Text style={styles.label}>Kilometraje entrada:</Text>
                  <Text style={styles.value}>{data.mileageIn.toLocaleString()} km</Text>
                </View>
              )}
              {data.mileageOut != null && (
                <View style={styles.row}>
                  <Text style={styles.label}>Kilometraje salida:</Text>
                  <Text style={styles.value}>{data.mileageOut.toLocaleString()} km</Text>
                </View>
              )}
            </View>
            <View style={styles.col}>
              {data.customerVehicle && (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>Marca/Modelo:</Text>
                    <Text style={styles.value}>
                      {data.customerVehicle.brand?.name ?? ""} {data.customerVehicle.vehicleModel?.name ?? ""}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Año:</Text>
                    <Text style={styles.value}>{data.customerVehicle.year || "—"}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Color:</Text>
                    <Text style={styles.value}>{data.customerVehicle.color || "—"}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>VIN:</Text>
                    <Text style={styles.value}>{data.customerVehicle.vin || "—"}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Asignaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asignaciones</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Técnico:</Text>
                <Text style={styles.value}>{data.assignedTechnicianId || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Asesor:</Text>
                <Text style={styles.value}>{data.assignedAdvisorId || "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Bahía:</Text>
                <Text style={styles.value}>{data.bayId || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Entrega estimada:</Text>
                <Text style={styles.value}>{formatDate(data.estimatedDelivery)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items */}
        {data.items && data.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trabajos y Repuestos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "8%" }]}>Tipo</Text>
                <Text style={[styles.tableHeaderCell, { width: "32%" }]}>Descripción</Text>
                <Text style={[styles.tableHeaderCell, { width: "8%", textAlign: "center" }]}>Cant.</Text>
                <Text style={[styles.tableHeaderCell, { width: "14%", textAlign: "right" }]}>Precio</Text>
                <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "center" }]}>Desc.%</Text>
                <Text style={[styles.tableHeaderCell, { width: "12%", textAlign: "center" }]}>Impuesto</Text>
                <Text style={[styles.tableHeaderCell, { width: "16%", textAlign: "right" }]}>Total</Text>
              </View>
              {data.items.map((line, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { width: "8%" }]}>{line.type}</Text>
                  <Text style={[styles.tableCell, { width: "32%" }]}>{line.description}</Text>
                  <Text style={[styles.tableCell, { width: "8%", textAlign: "center" }]}>
                    {line.quantity}
                  </Text>
                  <Text style={[styles.tableCell, { width: "14%", textAlign: "right" }]}>
                    {formatAmount(line.unitPrice, data.currency)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "10%", textAlign: "center" }]}>
                    {Number(line.discountPct) > 0 ? `${line.discountPct}%` : "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "12%", textAlign: "center" }]}>
                    {line.taxRate}%
                  </Text>
                  <Text style={[styles.tableCell, { width: "16%", textAlign: "right", fontFamily: "Roboto-Bold" }]}>
                    {formatAmount(line.total, data.currency)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Mano de obra:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.laborTotal, data.currency)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Repuestos:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.partsTotal, data.currency)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Otros:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.otherTotal, data.currency)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.subtotal, data.currency)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Impuestos:</Text>
            <Text style={styles.totalValue}>{formatAmount(data.taxAmt, data.currency)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.grandTotal}>{formatAmount(data.total, data.currency)}</Text>
          </View>
        </View>

        {/* Diagnóstico */}
        {data.diagnosisNotes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Diagnóstico</Text>
            <Text style={styles.valueFull}>{data.diagnosisNotes}</Text>
          </View>
        )}
        {data.observations && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Observaciones</Text>
            <Text style={styles.valueFull}>{data.observations}</Text>
          </View>
        )}

        {/* Firmas */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>Cliente</Text>
          <Text style={styles.signatureLine}>Técnico Responsable</Text>
          <Text style={styles.signatureLine}>Asesor de Servicio</Text>
        </View>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.folio}
        />
      </Page>
    </Document>
  );
};

export default ServiceOrderTemplate;
