import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import PdfDocumentHeader from "@/components/pdf/PdfDocumentHeader";
import PdfDocumentFooter from "@/components/pdf/PdfDocumentFooter";
import type { PdfCompanyInfo } from "@/components/pdf/pdfCompany";
import "@/utils/pdfUtils";
import type { WorkshopWarranty, WarrantyType, WarrantyStatus } from "../interfaces/warranty.interface";

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
  label: { fontSize: 8, color: "#6b7280", width: 100 },
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
  notesBox: { marginTop: 6, padding: 8, backgroundColor: "#f8fafc", borderRadius: 4 },
});

const TYPE_LABELS: Record<WarrantyType, string> = {
  LABOR: "Mano de Obra",
  PARTS: "Repuestos",
  MIXED: "Mixta",
  COMMERCIAL: "Comercial",
};

const STATUS_COLORS: Record<WarrantyStatus, { bg: string; text: string }> = {
  OPEN: { bg: "#dbeafe", text: "#1e40af" },
  IN_PROGRESS: { bg: "#fef9c3", text: "#854d0e" },
  RESOLVED: { bg: "#dcfce7", text: "#166534" },
  REJECTED: { bg: "#fecaca", text: "#991b1b" },
  CLOSED: { bg: "#f1f5f9", text: "#475569" },
};

const STATUS_LABELS: Record<WarrantyStatus, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En Proceso",
  RESOLVED: "Resuelta",
  REJECTED: "Rechazada",
  CLOSED: "Cerrada",
};

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(d);
  }
};

const WarrantyTemplate = ({ data, company }: { data: WorkshopWarranty; company?: PdfCompanyInfo }) => {
  const badgeColor = STATUS_COLORS[data.status] ?? STATUS_COLORS.OPEN;
  const vehicleBrand = data.customerVehicle?.brand?.name ?? "";
  const vehicleModel = data.customerVehicle?.vehicleModel?.name ?? "";
  const vehicleBrandModel = [vehicleBrand, vehicleModel].filter(Boolean).join(" ") || "—";

  return (
    <Document title={"Garantia - " + data.warrantyNumber}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Garantia"
          documentNumber={data.warrantyNumber}
          date={formatDate(data.createdAt)}
          status={STATUS_LABELS[data.status]}
          statusColor={badgeColor}
          type={TYPE_LABELS[data.type]}
        />

        {/* Tipo */}
        <View style={[styles.section, { marginTop: 8 }]}>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo de garantía:</Text>
            <Text style={styles.value}>{TYPE_LABELS[data.type]}</Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>{data.customer?.name ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Código:</Text>
                <Text style={styles.value}>{data.customer?.code ?? "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Teléfono:</Text>
                <Text style={styles.value}>{data.customer?.phone ?? data.customer?.mobile ?? "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehículo</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Placa:</Text>
                <Text style={styles.value}>{data.customerVehicle?.plate ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Marca / Modelo:</Text>
                <Text style={styles.value}>{vehicleBrandModel}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Año:</Text>
                <Text style={styles.value}>{data.customerVehicle?.year != null ? String(data.customerVehicle.year) : "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>VIN:</Text>
                <Text style={styles.value}>{data.customerVehicle?.vin ?? "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Órdenes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Órdenes de Trabajo</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>OT Original:</Text>
                <Text style={styles.value}>{data.originalOrder?.folio ?? "—"}</Text>
              </View>
            </View>
            {data.reworkOrder && (
              <View style={styles.col}>
                <View style={styles.row}>
                  <Text style={styles.label}>OT Retrabajo:</Text>
                  <Text style={styles.value}>{data.reworkOrder.folio}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.textBlock}>{data.description}</Text>
        </View>

        {/* Causa raíz */}
        {data.rootCause && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Causa Raíz</Text>
            <Text style={styles.textBlock}>{data.rootCause}</Text>
          </View>
        )}

        {/* Resolución */}
        {data.resolution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolución</Text>
            <Text style={styles.textBlock}>{data.resolution}</Text>
          </View>
        )}

        {/* Fechas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fechas</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Vencimiento:</Text>
                <Text style={styles.value}>{formatDate(data.expiresAt)}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Resuelta el:</Text>
                <Text style={styles.value}>{formatDate(data.resolvedAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Firmas */}
        <View style={[styles.signatureArea, { marginTop: 30 }]}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Cliente</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Técnico</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Responsable</Text>
          </View>
        </View>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.warrantyNumber}
        />
      </Page>
    </Document>
  );
};

export default WarrantyTemplate;
