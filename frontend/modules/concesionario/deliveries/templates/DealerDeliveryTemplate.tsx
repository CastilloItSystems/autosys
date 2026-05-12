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
import { DealerDelivery } from "../interfaces/dealerDelivery.interface";

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
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
  },
  checkboxChecked: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#166534",
    backgroundColor: "#dcfce7",
    borderRadius: 2,
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
  signatureBlock: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    width: 140,
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
  SCHEDULED: { bg: "#fef9c3", text: "#854d0e" },
  READY: { bg: "#dbeafe", text: "#1e40af" },
  DELIVERED: { bg: "#dcfce7", text: "#166534" },
  CANCELLED: { bg: "#fecaca", text: "#991b1b" },
};

const DealerDeliveryTemplate = ({ data, company }: { data: DealerDelivery; company?: PdfCompanyInfo }) => {
  const badgeColor = statusBadgeColors[data.status] || statusBadgeColors.SCHEDULED;

  return (
    <Document title={`Acta de Entrega - ${data.deliveryNumber}`}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Acta de Entrega de Vehiculo"
          documentNumber={data.deliveryNumber}
          date={formatDate(data.scheduledAt)}
          status={data.status}
          statusColor={badgeColor}
        />

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Comprador</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>{data.customerName || data.customer?.name || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Documento:</Text>
                <Text style={styles.value}>{data.customer?.taxId || "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Teléfono:</Text>
                <Text style={styles.value}>{data.customer?.phone || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{data.customer?.email || "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehículo */}
        {data.dealerUnit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehículo Entregado</Text>
            <View style={styles.grid2Col}>
              <View style={styles.col}>
                <View style={styles.row}>
                  <Text style={styles.label}>Marca / Modelo:</Text>
                  <Text style={styles.value}>{data.dealerUnit.brand.name} {data.dealerUnit.model?.name ?? ""}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>VIN:</Text>
                  <Text style={styles.value}>{data.dealerUnit.vin || "—"}</Text>
                </View>
              </View>
              <View style={styles.col}>
                <View style={styles.row}>
                  <Text style={styles.label}>Código:</Text>
                  <Text style={styles.value}>{data.dealerUnit.code}</Text>
                </View>
                {data.deliveredAt && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Fecha entrega:</Text>
                    <Text style={styles.value}>{formatDate(data.deliveredAt)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checklist de Entrega</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.checklistItem}>
                <View style={data.checklistCompleted ? styles.checkboxChecked : styles.checkbox} />
                <Text style={styles.value}>Inspección / Checklist completado</Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={data.documentsSigned ? styles.checkboxChecked : styles.checkbox} />
                <Text style={styles.value}>Documentos firmados</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.checklistItem}>
                <View style={data.accessoriesDelivered ? styles.checkboxChecked : styles.checkbox} />
                <Text style={styles.value}>Accesorios entregados</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Condición */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condición del Vehículo</Text>
          <Text style={styles.valueFull}>
            El comprador declara haber recibido el vehículo descrito en este documento
            en condiciones óptimas de funcionamiento, habiendo verificado el estado
            físico y mecánico del mismo. Se entregan las llaves, documentación y
            accesorios correspondientes.
          </Text>
        </View>

        {/* Firmas */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>Comprador</Text>
          <Text style={styles.signatureLine}>Vendedor / Gestor</Text>
          <Text style={styles.signatureLine}>Director / Gerente</Text>
        </View>

        <Text style={{ fontSize: 7, color: "#94a3b8", marginTop: 12, textAlign: "center" }}>
          Al firmar, el comprador acepta la entrega del vehículo en las condiciones descritas.
        </Text>

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.deliveryNumber}
        />
      </Page>
    </Document>
  );
};

export default DealerDeliveryTemplate;
