import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import "@/utils/pdfUtils";
import { VehicleDelivery } from "../interfaces/delivery.interface";

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

const DeliveryTemplate = ({ data }: { data: VehicleDelivery }) => {
  return (
    <Document title={`Entrega de Vehículo - ${data.id}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>Acta de Entrega de Vehículo</Text>
              <Text style={styles.headerSubtitle}>AutoSys</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerNumber}>ID: {data.id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.headerDate}>{formatDate(data.deliveredAt)}</Text>
          </View>
        </View>

        {/* Orden de servicio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orden de Servicio</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Folio OT:</Text>
                <Text style={styles.value}>{data.serviceOrder?.folio || "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Datos entrega */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de la Entrega</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Entregado por:</Text>
                <Text style={styles.value}>{data.deliveredBy || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Recibido por:</Text>
                <Text style={styles.value}>{data.receivedByName || "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Conformidad cliente:</Text>
                <Text style={styles.value}>{data.clientConformity ? "Sí" : "No"}</Text>
              </View>
              {data.nextVisitDate && (
                <View style={styles.row}>
                  <Text style={styles.label}>Próxima visita:</Text>
                  <Text style={styles.value}>{formatDate(data.nextVisitDate)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Condición entrega */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condición del Vehículo al Entregar</Text>
          <Text style={styles.valueFull}>
            El cliente declara haber recibido el vehículo en las condiciones acordadas.
            Se verifica que los trabajos solicitados han sido ejecutados conforme a la orden de servicio.
          </Text>
        </View>

        {data.observations && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Observaciones</Text>
            <Text style={styles.valueFull}>{data.observations}</Text>
          </View>
        )}

        {/* Firmas */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>Firma Cliente</Text>
          <Text style={styles.signatureLine}>Responsable de Entrega</Text>
        </View>

        <Text style={{ fontSize: 7, color: "#94a3b8", marginTop: 12, textAlign: "center" }}>
          Al firmar, el cliente acepta la entrega del vehículo y los trabajos realizados.
        </Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>AutoSys</Text>
          <Text style={styles.footerText}>Entrega #{data.id.slice(-8).toUpperCase()}</Text>
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

export default DeliveryTemplate;
