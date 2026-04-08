import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { GaritaEvent } from "@/libs/interfaces/workshop";

const TYPE_LABELS: Record<string, string> = {
  VEHICLE_IN:    "Ingreso de Vehículo",
  VEHICLE_OUT:   "Egreso de Vehículo",
  PART_OUT:      "Salida de Pieza (T.O.T.)",
  PART_IN:       "Reingreso de Pieza (T.O.T.)",
  ROAD_TEST_OUT: "Salida — Prueba de Carretera",
  ROAD_TEST_IN:  "Reingreso — Prueba de Carretera",
  OTHER:         "Otro Movimiento",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:    "Pendiente",
  AUTHORIZED: "Autorizado",
  COMPLETED:  "Completado",
  FLAGGED:    "Irregularidad",
  CANCELLED:  "Cancelado",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 52,
    paddingHorizontal: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 12,
    marginBottom: 18,
  },
  headerLeft: { width: "60%" },
  headerRight: { width: "38%", alignItems: "flex-end" },
  headerTitle: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 2 },
  headerSubtitle: { fontSize: 9, color: "#64748b" },
  headerFolio: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#1e3a8a" },
  headerStatusBox: {
    marginTop: 4, paddingVertical: 3, paddingHorizontal: 8,
    backgroundColor: "#f1f5f9", borderRadius: 3,
  },
  headerDate: { fontSize: 9, color: "#475569" },

  // ── Type banner ─────────────────────────────────────────────────────────────
  typeBanner: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 4, marginBottom: 16,
    flexDirection: "row", alignItems: "center",
  },
  typeBannerText: {
    fontSize: 12, fontFamily: "Helvetica-Bold", color: "#ffffff",
  },

  // ── Section ─────────────────────────────────────────────────────────────────
  section: { marginBottom: 14 },
  sectionTitle: {
    backgroundColor: "#f8fafc",
    paddingVertical: 4, paddingHorizontal: 6,
    borderLeftWidth: 3, borderLeftColor: "#3b82f6",
    marginBottom: 8,
    fontFamily: "Helvetica-Bold", fontSize: 10, color: "#0f172a",
  },
  grid2: { flexDirection: "row", justifyContent: "space-between" },
  colHalf: { width: "48%" },

  row: { flexDirection: "row", marginBottom: 5, alignItems: "flex-start" },
  label: { width: "42%", fontFamily: "Helvetica-Bold", color: "#64748b", fontSize: 9 },
  value: { width: "58%", fontSize: 9, color: "#1e293b" },
  valueFull: { width: "100%", fontSize: 9, color: "#1e293b", lineHeight: 1.4 },

  // ── Alert box ───────────────────────────────────────────────────────────────
  alertBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1, borderColor: "#fca5a5", borderRadius: 4,
    paddingVertical: 6, paddingHorizontal: 8, marginBottom: 14,
  },
  alertTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, color: "#991b1b", marginBottom: 3 },
  alertText: { fontSize: 9, color: "#7f1d1d" },

  // ── Signature area ──────────────────────────────────────────────────────────
  sigRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 30 },
  sigBox: { width: "28%", alignItems: "center" },
  sigLine: { borderTopWidth: 1, borderTopColor: "#94a3b8", width: "100%", marginBottom: 5 },
  sigTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#334155", textAlign: "center" },
  sigSub: { fontSize: 8, color: "#64748b", textAlign: "center", marginTop: 2 },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute", bottom: 20, left: 32, right: 32,
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8,
  },
  footerText: { fontSize: 8, color: "#94a3b8" },
});

const fmt = (d?: string | null) =>
  d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: es }) : "—";

interface Props {
  data: GaritaEvent & { empresaName?: string };
}

const GaritaEventTemplate: React.FC<Props> = ({ data }) => {
  const eventId = data.id.slice(-8).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{data.empresaName ?? "Taller Automotriz"}</Text>
            <Text style={styles.headerSubtitle}>Registro de Movimiento de Garita / Vigilancia</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerFolio}>REG-{eventId}</Text>
            <View style={styles.headerStatusBox}>
              <Text style={styles.headerDate}>
                Estado: {STATUS_LABELS[data.status] ?? data.status}
              </Text>
            </View>
            <Text style={[styles.headerDate, { marginTop: 4 }]}>
              Fecha: {fmt(data.eventAt)}
            </Text>
          </View>
        </View>

        {/* Tipo de evento */}
        <View style={styles.typeBanner}>
          <Text style={styles.typeBannerText}>
            {TYPE_LABELS[data.type] ?? data.type}
          </Text>
        </View>

        {/* Datos del vehículo + Conductor (2 columnas) */}
        <View style={styles.grid2}>
          <View style={[styles.colHalf, styles.section]}>
            <Text style={styles.sectionTitle}>Datos del Vehículo</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Placa:</Text>
              <Text style={styles.value}>{data.plateNumber ?? "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Descripción:</Text>
              <Text style={styles.value}>{data.vehicleDesc ?? "—"}</Text>
            </View>
            {data.kmIn != null && (
              <View style={styles.row}>
                <Text style={styles.label}>Km entrada:</Text>
                <Text style={styles.value}>{data.kmIn.toLocaleString()} km</Text>
              </View>
            )}
            {data.kmOut != null && (
              <View style={styles.row}>
                <Text style={styles.label}>Km salida:</Text>
                <Text style={styles.value}>{data.kmOut.toLocaleString()} km</Text>
              </View>
            )}
            {data.serialMotor && (
              <View style={styles.row}>
                <Text style={styles.label}>Serial motor:</Text>
                <Text style={styles.value}>{data.serialMotor}</Text>
              </View>
            )}
            {data.serialBody && (
              <View style={styles.row}>
                <Text style={styles.label}>Serial carrocería:</Text>
                <Text style={styles.value}>{data.serialBody}</Text>
              </View>
            )}
          </View>

          <View style={[styles.colHalf, styles.section]}>
            <Text style={styles.sectionTitle}>Conductor / Responsable</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{data.driverName ?? "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Cédula:</Text>
              <Text style={styles.value}>{data.driverId ?? "—"}</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Vinculación</Text>
            {data.serviceOrder ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Orden de trabajo:</Text>
                  <Text style={styles.value}>{data.serviceOrder.folio}</Text>
                </View>
                {data.serviceOrder.vehiclePlate && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Placa OT:</Text>
                    <Text style={styles.value}>{data.serviceOrder.vehiclePlate}</Text>
                  </View>
                )}
              </>
            ) : data.tot ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>T.O.T.:</Text>
                  <Text style={styles.value}>{data.tot.totNumber}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Pieza:</Text>
                  <Text style={styles.value}>{data.tot.partDescription}</Text>
                </View>
              </>
            ) : (
              <View style={styles.row}>
                <Text style={styles.label}>Referencia:</Text>
                <Text style={styles.value}>Sin vinculación</Text>
              </View>
            )}
          </View>
        </View>

        {/* Autorización / Pase */}
        {(data.exitPassRef || data.authorizedAt) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Autorización de Salida</Text>
            {data.exitPassRef && (
              <View style={styles.row}>
                <Text style={styles.label}>Pase de salida:</Text>
                <Text style={styles.value}>{data.exitPassRef}</Text>
              </View>
            )}
            {data.authorizedAt && (
              <View style={styles.row}>
                <Text style={styles.label}>Fecha autorización:</Text>
                <Text style={styles.value}>{fmt(data.authorizedAt)}</Text>
              </View>
            )}
            {data.completedAt && (
              <View style={styles.row}>
                <Text style={styles.label}>Fecha completado:</Text>
                <Text style={styles.value}>{fmt(data.completedAt)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Irregularidad */}
        {data.hasIrregularity && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>⚠ Irregularidad Registrada</Text>
            <Text style={styles.alertText}>{data.irregularityNotes ?? "Sin descripción"}</Text>
          </View>
        )}

        {/* Notas */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

        {/* Firmas */}
        <View style={styles.sigRow} wrap={false}>
          <View style={styles.sigBox}>
            <View style={{ height: 40 }} />
            <View style={styles.sigLine} />
            <Text style={styles.sigTitle}>Vigilante / Garita</Text>
            <Text style={styles.sigSub}>Firma y sello</Text>
          </View>
          <View style={styles.sigBox}>
            <View style={{ height: 40 }} />
            <View style={styles.sigLine} />
            <Text style={styles.sigTitle}>Jefe de Taller</Text>
            <Text style={styles.sigSub}>Autorización</Text>
          </View>
          <View style={styles.sigBox}>
            <View style={{ height: 40 }} />
            <View style={styles.sigLine} />
            <Text style={styles.sigTitle}>Conductor / Responsable</Text>
            <Text style={styles.sigSub}>{data.driverName ?? "_______________"}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            AutoSys · Registro REG-{eventId} · Generado el {fmt(new Date().toISOString())}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  );
};

export default GaritaEventTemplate;
