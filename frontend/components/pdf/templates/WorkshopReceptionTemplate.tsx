import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChecklistResponsePDF {
  itemName: string;
  boolValue?: boolean | null;
  textValue?: string | null;
  numValue?: number | null;
  selectionValue?: string | null;
  observation?: string | null;
}

interface DamagePDF {
  zone: string;
  description: string;
  severity: string;
  photoUrl?: string | null;
}

interface PhotoPDF {
  url: string;
  type: string;
  description?: string | null;
}

interface ReceptionPDFData {
  folio: string;
  status: string;
  createdAt: string;
  // Cliente
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  // Vehículo
  vehiclePlate?: string;
  vehicleDesc?: string;
  mileageIn?: number | null;
  fuelLevel?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleColor?: string | null;
  vehicleVin?: string | null;
  // Accesorios y daños
  accessories?: string[];
  hasPreExistingDamage: boolean;
  damageNotes?: string;
  damages?: DamagePDF[];
  // Solicitud
  clientDescription?: string;
  // Autorización
  authorizationName?: string;
  authorizationPhone?: string;
  estimatedDelivery?: string | null;
  appointmentFolio?: string | null;
  serviceOrderFolio?: string | null;
  diagnosticAuthorized: boolean;
  // Firma
  clientSignature?: string | null;
  // Checklist
  checklistName?: string;
  checklistResponses?: ChecklistResponsePDF[];
  // Fotos
  photos?: PhotoPDF[];
  // Empresa
  empresaName?: string;
  empresaLogo?: string;
}

interface WorkshopReceptionTemplateProps {
  data: ReceptionPDFData;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    width: "60%",
  },
  logo: { width: 55, height: 55, marginRight: 15, objectFit: "contain" },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  headerSubtitle: { fontSize: 9, color: "#64748b", marginTop: 2 },
  headerRight: {
    alignItems: "flex-end",
    width: "40%",
  },
  headerFolio: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e3a8a",
  },
  headerStatusBox: {
    marginTop: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
  },
  headerDate: { fontSize: 9, color: "#475569" },

  // 2 Column Layout
  grid2Col: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  colHalf: {
    width: "48%",
  },

  section: { marginBottom: 12 },
  sectionTitle: {
    backgroundColor: "#f8fafc",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
    marginBottom: 8,
    fontWeight: "bold",
    fontSize: 11,
    color: "#0f172a",
  },
  row: { flexDirection: "row", marginBottom: 4, alignItems: "flex-start" },
  label: { width: "40%", fontWeight: "bold", color: "#64748b", fontSize: 9 },
  value: { width: "60%", fontSize: 9, color: "#1e293b" },
  valueFull: { width: "100%", fontSize: 9, color: "#1e293b", lineHeight: 1.4 },

  badge: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    fontWeight: "bold",
    fontSize: 8,
    alignSelf: "flex-start",
  },
  badgeSuccess: { backgroundColor: "#dcfce7", color: "#166534" },
  badgeWarning: { backgroundColor: "#fef9c3", color: "#854d0e" },
  badgeDanger: { backgroundColor: "#fecaca", color: "#991b1b" },

  // Tablas
  table: {
    width: "100%",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  tableHeaderCell: {
    padding: 6,
    fontWeight: "bold",
    fontSize: 9,
    color: "#334155",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableRowStriped: {
    backgroundColor: "#fafafa",
  },
  tableCell: { padding: 6, fontSize: 8, color: "#334155" },

  // Fotos (Polaroid Style)
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
  },
  photoCell: {
    width: "31%", // 3 columnas
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    marginBottom: 8,
  },
  photoImage: {
    width: "100%",
    height: 100,
    objectFit: "cover",
    marginBottom: 6,
    borderRadius: 2,
    backgroundColor: "#f8fafc",
  },
  photoLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
  },
  photoDesc: {
    fontSize: 7,
    color: "#64748b",
    textAlign: "center",
    marginTop: 2,
  },

  // Firma
  signatureContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  signatureLineBox: {
    width: 250,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 8,
  },
  signatureImage: {
    width: 180,
    height: 70,
    marginBottom: 5,
    objectFit: "contain",
  },
  signatureTitle: { fontSize: 10, fontWeight: "bold", color: "#334155" },
  signatureSubtitle: { fontSize: 8, color: "#64748b", marginTop: 2 },

  // Footer Paginación
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
});

const fuelLevelLabel: Record<string, string> = {
  EMPTY: "Vacío",
  QUARTER: "1/4",
  HALF: "1/2",
  THREE_QUARTERS: "3/4",
  FULL: "Lleno",
};

const statusLabel: Record<string, string> = {
  OPEN: "Abierta",
  DIAGNOSING: "En diagnóstico",
  QUOTED: "Cotizada",
  CONVERTED_TO_SO: "Convertida a OT",
  CANCELLED: "Cancelada",
};

const severityLabel: Record<string, string> = {
  MINOR: "Menor",
  MODERATE: "Moderado",
  SEVERE: "Severo",
};

const photoTypeLabel: Record<string, string> = {
  FRONTAL: "Frontal",
  REAR: "Trasera",
  LEFT: "Lateral Izq.",
  RIGHT: "Lateral Der.",
  INTERIOR: "Interior",
  DAMAGE: "Daño",
  DOCUMENT: "Documento",
  OTHER: "Otra",
};

const formatDate = (d: string) => {
  if (!d) return "N/A";
  return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: es });
};

const formatChecklistValue = (r: ChecklistResponsePDF): string => {
  if (r.boolValue !== null && r.boolValue !== undefined)
    return r.boolValue ? "Sí" : "No";
  if (r.textValue) return r.textValue;
  if (r.numValue !== null && r.numValue !== undefined)
    return String(r.numValue);
  if (r.selectionValue) return r.selectionValue;
  return "—";
};

const WorkshopReceptionTemplate: React.FC<WorkshopReceptionTemplateProps> = ({
  data,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Header (Muestra en todas las páginas opcional, o solo en primera. Lo dejaremos en flujo normal) */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            {data.empresaLogo && (
              <Image src={data.empresaLogo} style={styles.logo} />
            )}
            <View>
              <Text style={styles.headerTitle}>
                {data.empresaName || "Taller Mecánico"}
              </Text>
              <Text style={styles.headerSubtitle}>
                Documento de Recepción de Vehículo
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerFolio}>Recepción: {data.folio}</Text>
            <View style={styles.headerStatusBox}>
              <Text style={styles.headerDate}>
                Estado: {statusLabel[data.status] || data.status}
              </Text>
            </View>
            <Text style={[styles.headerDate, { marginTop: 4 }]}>
              Fecha: {formatDate(data.createdAt)}
            </Text>
          </View>
        </View>

        {/* 2 Columnas: Vehículo y Cliente */}
        <View style={styles.grid2Col}>
          {/* Columna Izquierda: Vehículo */}
          <View style={styles.colHalf}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos del Vehículo</Text>
              {data.vehiclePlate && (
                <View style={styles.row}>
                  <Text style={styles.label}>Placa:</Text>
                  <Text style={styles.value}>{data.vehiclePlate}</Text>
                </View>
              )}
              {(data.vehicleBrand || data.vehicleModel) && (
                <View style={styles.row}>
                  <Text style={styles.label}>Vehículo:</Text>
                  <Text style={styles.value}>
                    {[data.vehicleBrand, data.vehicleModel, data.vehicleYear]
                      .filter(Boolean)
                      .join(" ")}
                  </Text>
                </View>
              )}
              {data.vehicleColor && (
                <View style={styles.row}>
                  <Text style={styles.label}>Color:</Text>
                  <Text style={styles.value}>{data.vehicleColor}</Text>
                </View>
              )}
              {data.vehicleVin && (
                <View style={styles.row}>
                  <Text style={styles.label}>VIN:</Text>
                  <Text style={styles.value}>{data.vehicleVin}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Kilometraje:</Text>
                <Text style={styles.value}>
                  {data.mileageIn != null
                    ? `${data.mileageIn.toLocaleString()} km`
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Combustible:</Text>
                <Text style={styles.value}>
                  {data.fuelLevel
                    ? fuelLevelLabel[data.fuelLevel] || data.fuelLevel
                    : "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* Columna Derecha: Cliente y Autorización */}
          <View style={styles.colHalf}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos del Cliente</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>{data.customerName}</Text>
              </View>
              {data.customerPhone && (
                <View style={styles.row}>
                  <Text style={styles.label}>Teléfono:</Text>
                  <Text style={styles.value}>{data.customerPhone}</Text>
                </View>
              )}
              {data.customerEmail && (
                <View style={styles.row}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{data.customerEmail}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recepción</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Autoriza:</Text>
                <Text style={styles.value}>
                  {data.authorizationName || data.customerName}
                </Text>
              </View>
              {data.estimatedDelivery && (
                <View style={styles.row}>
                  <Text style={styles.label}>Entrega est.:</Text>
                  <Text style={styles.value}>
                    {formatDate(data.estimatedDelivery)}
                  </Text>
                </View>
              )}
              {data.serviceOrderFolio && (
                <View style={styles.row}>
                  <Text style={styles.label}>Orden Trabajo:</Text>
                  <Text style={styles.value}>{data.serviceOrderFolio}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Motivo de Ingreso / Solicitud */}
        {data.clientDescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Motivo de Ingreso / Solicitud del Cliente
            </Text>
            <Text style={styles.valueFull}>{data.clientDescription}</Text>
          </View>
        )}

        {/* Accesorios y Estado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Ingreso</Text>
          {data.accessories && data.accessories.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Accesorios dejados:</Text>
              <Text style={styles.value}>{data.accessories.join(", ")}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Daños preexistentes:</Text>
            <Text
              style={[
                styles.value,
                {
                  color: data.hasPreExistingDamage ? "#dc2626" : "#16a34a",
                  fontWeight: "bold",
                },
              ]}
            >
              {data.hasPreExistingDamage
                ? "Sí reporta daños"
                : "No reporta daños"}
            </Text>
          </View>
          {data.hasPreExistingDamage && data.damageNotes && (
            <View style={styles.row}>
              <Text style={styles.label}>Notas de daños:</Text>
              <Text style={styles.valueFull}>{data.damageNotes}</Text>
            </View>
          )}
        </View>

        {/* Daños Registrados */}
        {data.damages && data.damages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registro de Daños Físicos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "30%" }]}>
                  Zona
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "45%" }]}>
                  Descripción
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
                  Severidad
                </Text>
              </View>
              {data.damages.map((dmg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowStriped : {},
                    idx === data.damages!.length - 1
                      ? { borderBottomWidth: 0 }
                      : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { width: "30%" }]}>
                    {dmg.zone}
                  </Text>
                  <Text style={[styles.tableCell, { width: "45%" }]}>
                    {dmg.description}
                  </Text>
                  <View style={[styles.tableCell, { width: "25%" }]}>
                    <Text
                      style={[
                        styles.badge,
                        dmg.severity === "MINOR"
                          ? styles.badgeSuccess
                          : dmg.severity === "MODERATE"
                          ? styles.badgeWarning
                          : styles.badgeDanger,
                      ]}
                    >
                      {severityLabel[dmg.severity] || dmg.severity}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Checklist */}
        {data.checklistResponses && data.checklistResponses.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>
              Checklist de Inspección{" "}
              {data.checklistName ? `(${data.checklistName})` : ""}
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "45%" }]}>
                  Punto de Inspección
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                  Estado
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "35%" }]}>
                  Observaciones
                </Text>
              </View>
              {data.checklistResponses.map((r, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowStriped : {},
                    idx === data.checklistResponses!.length - 1
                      ? { borderBottomWidth: 0 }
                      : {},
                  ]}
                >
                  <Text
                    style={[
                      styles.tableCell,
                      { width: "45%", fontWeight: "bold" },
                    ]}
                  >
                    {r.itemName}
                  </Text>
                  <Text style={[styles.tableCell, { width: "20%" }]}>
                    {formatChecklistValue(r)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: "35%", color: "#64748b" },
                    ]}
                  >
                    {r.observation || "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Evidencia Fotográfica */}
        {data.photos && data.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidencia Fotográfica</Text>
            <View style={styles.photoGrid}>
              {data.photos.map((photo, idx) => (
                <View key={idx} style={styles.photoCell} wrap={false}>
                  {photo.url ? (
                    <Image src={photo.url} style={styles.photoImage} />
                  ) : (
                    <View
                      style={[
                        styles.photoImage,
                        { justifyContent: "center", alignItems: "center" },
                      ]}
                    >
                      <Text style={{ fontSize: 8, color: "#cbd5e1" }}>
                        Sin imagen
                      </Text>
                    </View>
                  )}
                  <Text style={styles.photoLabel}>
                    {photoTypeLabel[photo.type] || photo.type}
                  </Text>
                  {photo.description && (
                    <Text style={styles.photoDesc}>{photo.description}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Firma */}
        <View style={styles.signatureContainer} wrap={false}>
          {data.clientSignature ? (
            <Image src={data.clientSignature} style={styles.signatureImage} />
          ) : (
            <View style={{ height: 60 }} />
          )}
          <View style={styles.signatureLineBox}>
            <Text style={styles.signatureTitle}>
              Firma de Conformidad del Cliente
            </Text>
            <Text style={styles.signatureSubtitle}>
              {data.authorizationName || data.customerName}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 7,
              color: "#94a3b8",
              marginTop: 8,
              textAlign: "center",
              maxWidth: 400,
            }}
          >
            Al firmar este documento, el cliente autoriza la revisión y/o
            reparación del vehículo descrito, aceptando que el taller no se hace
            responsable por objetos de valor no declarados en este inventario.
          </Text>
        </View>

        {/* Footer (Paginación) */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generado por AutoSys el {formatDate(new Date().toISOString())}
          </Text>
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

export default WorkshopReceptionTemplate;
