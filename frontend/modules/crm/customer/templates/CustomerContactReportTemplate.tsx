import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import PdfDocumentHeader from "@/components/pdf/PdfDocumentHeader";
import PdfDocumentFooter from "@/components/pdf/PdfDocumentFooter";
import type { PdfCompanyInfo } from "@/components/pdf/pdfCompany";
import "@/utils/pdfUtils";
import type { CustomerCrm } from "../interfaces/customer.crm.interface";

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
  headerCode: { fontSize: 10, fontFamily: "Roboto-Bold", color: "#1e3a8a" },
  headerType: { fontSize: 8, color: "#64748b", marginTop: 2 },
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
  label: { width: "42%", color: "#64748b", fontSize: 8 },
  value: { width: "58%", fontSize: 8, color: "#1e293b" },
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
  tableHeaderCell: { color: "#ffffff", fontFamily: "Roboto-Bold", fontSize: 8 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  tableCell: { fontSize: 7.5, color: "#334155" },
  notesBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: "Roboto-Bold",
    color: "#64748b",
    marginBottom: 2,
  },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  statCard: {
    flex: 1,
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  statLabel: { fontSize: 7, color: "#64748b" },
  statValue: { fontSize: 11, fontFamily: "Roboto-Bold", color: "#1e3a8a", marginTop: 2 },
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
});

const TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "Persona Natural",
  COMPANY: "Empresa",
};

const SEGMENT_LABELS: Record<string, string> = {
  PROSPECT: "Prospecto",
  REGULAR: "Regular",
  VIP: "VIP",
  WHOLESALE: "Mayorista",
  INACTIVE: "Inactivo",
};

const CHANNEL_LABELS: Record<string, string> = {
  REPUESTOS: "Repuestos",
  TALLER: "Taller",
  VEHICULOS: "Vehículos",
  ALL: "Todos",
};

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(d);
  }
};

const formatAmount = (value?: number | null, currency = "USD") => {
  if (value == null) return "—";
  const sym = { USD: "$", EUR: "€", VES: "Bs." }[currency] ?? "$";
  return `${sym} ${Number(value).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const CustomerContactReportTemplate = ({ data, company }: { data: CustomerCrm; company?: PdfCompanyInfo }) => {
  const contacts = data.contacts ?? [];
  const vehicles = data.vehicles ?? [];

  return (
    <Document title={`Ficha de Cliente - ${data.name}`}>
      <Page size="A4" style={styles.page}>
                <PdfDocumentHeader
          company={company}
          title="Ficha de Cliente"
          documentNumber={data.code}
          date={formatDate(data.createdAt)}
          type={TYPE_LABELS[data.type] ?? data.type}
        />

        {/* Datos Generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Generales</Text>
          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>RIF / Tax ID:</Text>
                <Text style={styles.value}>{data.taxId ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Correo:</Text>
                <Text style={styles.value}>{data.email ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Teléfono:</Text>
                <Text style={styles.value}>{data.phone ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Móvil:</Text>
                <Text style={styles.value}>{data.mobile ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Dirección:</Text>
                <Text style={styles.value}>{data.address ?? "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Segmento:</Text>
                <Text style={styles.value}>
                  {SEGMENT_LABELS[data.segment] ?? data.segment}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Canal Preferido:</Text>
                <Text style={styles.value}>
                  {CHANNEL_LABELS[data.preferredChannel] ?? data.preferredChannel}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Lista de Precios:</Text>
                <Text style={styles.value}>{String(data.priceList)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Límite de Crédito:</Text>
                <Text style={styles.value}>{formatAmount(data.creditLimit)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Días de Crédito:</Text>
                <Text style={styles.value}>{`${data.creditDays} días`}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Descuento por Def.:</Text>
                <Text style={styles.value}>{`${Number(data.defaultDiscount)}%`}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Contrib. Especial:</Text>
                <Text style={styles.value}>
                  {data.isSpecialTaxpayer ? "Sí" : "No"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Registro:</Text>
                <Text style={styles.value}>{formatDate(data.createdAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contactos */}
        {contacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {`Contactos (${contacts.length})`}
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Nombre</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Cargo</Text>
                <Text style={[styles.tableHeaderCell, { width: 80 }]}>Teléfono</Text>
                <Text style={[styles.tableHeaderCell, { width: 80 }]}>Móvil</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Correo</Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: 44, textAlign: "center" },
                  ]}
                >
                  Principal
                </Text>
              </View>
              {contacts.map((c, idx) => (
                <View
                  key={c.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 2 }]}>{c.name}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {c.role ?? "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: 80 }]}>
                    {c.phone ?? "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: 80 }]}>
                    {c.mobile ?? "—"}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {c.email ?? "—"}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 44, textAlign: "center" },
                    ]}
                  >
                    {c.isPrimary ? "Si" : "No"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Vehículos */}
        {vehicles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {`Vehículos (${vehicles.length})`}
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: 80 }]}>Placa</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Marca / Modelo</Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: 50, textAlign: "center" },
                  ]}
                >
                  Año
                </Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Color</Text>
              </View>
              {vehicles.map((v, idx) => (
                <View
                  key={v.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { width: 80 }]}>{v.plate}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {v.brand && v.vehicleModel
                      ? `${v.brand.name} ${v.vehicleModel.name}`
                      : v.brand
                        ? v.brand.name
                        : "—"}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 50, textAlign: "center" },
                    ]}
                  >
                    {v.year != null ? String(v.year) : "—"}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {v.color ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Estadísticas */}
        {data._count && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estadísticas</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Órdenes</Text>
                <Text style={styles.statValue}>
                  {String(data._count.orders)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Leads</Text>
                <Text style={styles.statValue}>
                  {String(data._count.leads)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Interacciones</Text>
                <Text style={styles.statValue}>
                  {String(data._count.interactions)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.valueFull}>{data.notes}</Text>
          </View>
        )}

                <PdfDocumentFooter
          companyName={company?.name}
          documentNumber={data.code}
        />
      </Page>
    </Document>
  );
};

export default CustomerContactReportTemplate;
