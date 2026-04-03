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
  // Accesorios y daños
  accessories?: string[];
  hasPreExistingDamage: boolean;
  damageNotes?: string;
  // Solicitud
  clientDescription?: string;
  // Autorización
  authorizationName?: string;
  authorizationPhone?: string;
  diagnosticAuthorized: boolean;
  // Firma
  clientSignature?: string | null;
  // Checklist
  checklistName?: string;
  checklistResponses?: ChecklistResponsePDF[];
  // Empresa
  empresaName?: string;
  empresaLogo?: string;
}

interface WorkshopReceptionTemplateProps {
  data: ReceptionPDFData;
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 8,
  },
  logo: { width: 48, height: 48, marginRight: 10 },
  headerTitle: { fontSize: 14, fontWeight: "bold", color: "#1e293b" },
  headerFolio: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563eb",
    marginTop: 2,
  },
  headerDate: { fontSize: 8, color: "#64748b", marginTop: 2 },
  section: { marginTop: 10, marginBottom: 6 },
  sectionTitle: {
    backgroundColor: "#f1f5f9",
    padding: 5,
    borderRadius: 4,
    marginBottom: 6,
    fontWeight: "bold",
    fontSize: 11,
    color: "#1e293b",
  },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: "35%", fontWeight: "bold", color: "#475569", fontSize: 9 },
  value: { width: "65%", fontSize: 9, color: "#1e293b" },
  badge: {
    padding: 3,
    borderRadius: 3,
    fontWeight: "bold",
    fontSize: 8,
    alignSelf: "flex-start",
  },
  badgeSuccess: { backgroundColor: "#dcfce7", color: "#166534" },
  badgeWarning: { backgroundColor: "#fef9c3", color: "#854d0e" },
  badgeDanger: { backgroundColor: "#fecaca", color: "#991b1b" },
  // Tabla checklist
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    padding: 5,
    fontWeight: "bold",
    fontSize: 8,
    color: "#334155",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  tableCell: { padding: 4, fontSize: 8, color: "#1e293b" },
  // Firma
  signatureContainer: {
    marginTop: 24,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
  },
  signatureImage: { width: 200, height: 80 },
  signatureLine: { marginTop: 8, fontSize: 9, color: "#64748b" },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 24,
    right: 24,
    textAlign: "center",
    fontSize: 7,
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
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          {data.empresaLogo && (
            <Image src={data.empresaLogo} style={styles.logo} />
          )}
          <View>
            <Text style={styles.headerTitle}>
              {data.empresaName || "Taller"}
            </Text>
            <Text style={styles.headerFolio}>Recepción {data.folio}</Text>
            <Text style={styles.headerDate}>
              Fecha: {formatDate(data.createdAt)} | Estado:{" "}
              {statusLabel[data.status] || data.status}
            </Text>
          </View>
        </View>

        {/* Datos del Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
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

        {/* Datos del Vehículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Vehículo</Text>
          {data.vehiclePlate && (
            <View style={styles.row}>
              <Text style={styles.label}>Placa:</Text>
              <Text style={styles.value}>{data.vehiclePlate}</Text>
            </View>
          )}
          {data.vehicleDesc && (
            <View style={styles.row}>
              <Text style={styles.label}>Descripción:</Text>
              <Text style={styles.value}>{data.vehicleDesc}</Text>
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
            <Text style={styles.label}>Nivel de combustible:</Text>
            <Text style={styles.value}>
              {data.fuelLevel
                ? fuelLevelLabel[data.fuelLevel] || data.fuelLevel
                : "N/A"}
            </Text>
          </View>
        </View>

        {/* Accesorios y Estado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado del Vehículo</Text>
          {data.accessories && data.accessories.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Accesorios:</Text>
              <Text style={styles.value}>{data.accessories.join(", ")}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Daños preexistentes:</Text>
            <Text
              style={[
                styles.value,
                { color: data.hasPreExistingDamage ? "#dc2626" : "#16a34a" },
              ]}
            >
              {data.hasPreExistingDamage ? "Sí" : "No"}
            </Text>
          </View>
          {data.hasPreExistingDamage && data.damageNotes && (
            <View style={styles.row}>
              <Text style={styles.label}>Descripción daños:</Text>
              <Text style={styles.value}>{data.damageNotes}</Text>
            </View>
          )}
        </View>

        {/* Solicitud del Cliente */}
        {data.clientDescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solicitud del Cliente</Text>
            <Text style={{ fontSize: 9, color: "#1e293b", lineHeight: 1.4 }}>
              {data.clientDescription}
            </Text>
          </View>
        )}

        {/* Checklist */}
        {data.checklistResponses && data.checklistResponses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Checklist de Inspección
              {data.checklistName ? `: ${data.checklistName}` : ""}
            </Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: "45%" }]}>
                Punto de Inspección
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
                Resultado
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "30%" }]}>
                Observación
              </Text>
            </View>
            {data.checklistResponses.map((r, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  { backgroundColor: idx % 2 === 0 ? "#fff" : "#f8fafc" },
                ]}
              >
                <Text style={[styles.tableCell, { width: "45%" }]}>
                  {r.itemName}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { width: "25%", fontWeight: "bold" },
                  ]}
                >
                  {formatChecklistValue(r)}
                </Text>
                <Text
                  style={[styles.tableCell, { width: "30%", color: "#64748b" }]}
                >
                  {r.observation || "—"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Autorización */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autorización</Text>
          {data.authorizationName && (
            <View style={styles.row}>
              <Text style={styles.label}>Persona que autoriza:</Text>
              <Text style={styles.value}>{data.authorizationName}</Text>
            </View>
          )}
          {data.authorizationPhone && (
            <View style={styles.row}>
              <Text style={styles.label}>Teléfono:</Text>
              <Text style={styles.value}>{data.authorizationPhone}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Diagnóstico autorizado:</Text>
            <Text
              style={[
                styles.badge,
                data.diagnosticAuthorized
                  ? styles.badgeSuccess
                  : styles.badgeDanger,
              ]}
            >
              {data.diagnosticAuthorized ? "AUTORIZADO" : "NO AUTORIZADO"}
            </Text>
          </View>
        </View>

        {/* Firma */}
        <View style={styles.signatureContainer}>
          {data.clientSignature ? (
            <>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "bold",
                  color: "#334155",
                  marginBottom: 4,
                }}
              >
                Firma del Cliente
              </Text>
              <Image src={data.clientSignature} style={styles.signatureImage} />
              <Text style={styles.signatureLine}>
                {data.authorizationName || "Cliente"}
              </Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 9, color: "#94a3b8", marginBottom: 20 }}>
                Firma del Cliente
              </Text>
              <Text style={{ fontSize: 12, color: "#cbd5e1" }}>
                ___________________________
              </Text>
            </>
          )}
        </View>

        <Text style={styles.footer}>
          Documento generado el {formatDate(new Date().toISOString())} |{" "}
          {data.folio} | Página 1 de 1
        </Text>
      </Page>
    </Document>
  );
};

export default WorkshopReceptionTemplate;
