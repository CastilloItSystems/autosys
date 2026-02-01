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
import { Factura } from "@/libs/interfaces";

interface FacturaTemplateProps {
  data: Factura;
  logoUrl: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#3498db",
    paddingBottom: 4,
  },
  logo: {
    width: 38,
    height: 38,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  section: {
    marginTop: 6,
    marginBottom: 5,
  },
  sectionTitle: {
    backgroundColor: "#f5f5f5",
    padding: 3,
    borderRadius: 3,
    marginBottom: 3,
    fontWeight: "bold",
    fontSize: 9,
    color: "#222",
    textAlign: "left",
  },
  tableBox: {
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 6,
    marginBottom: 8,
    marginTop: 4,
    backgroundColor: "#fafdff",
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#bbdefb",
  },
  tableRowFirst: {
    borderTopWidth: 0,
  },
  tableLabel: {
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: "#e3f2fd",
    padding: 3,
    fontSize: 8,
    color: "#333",
    textAlign: "left",
    fontWeight: "bold",
  },
  tableValue: {
    flex: 2,
    padding: 3,
    fontSize: 8,
    color: "#222",
    textAlign: "left",
  },
  footer: {
    position: "absolute",
    bottom: 10,
    left: 18,
    right: 18,
    textAlign: "center",
    fontSize: 7,
    color: "#888",
  },
});

const formatDecimal = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === "") return "0,00";
  return Number(value).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
};

const FacturaTemplate: React.FC<FacturaTemplateProps> = ({ data, logoUrl }) => {
  const renderTableRows = (rows: { label: string; value: string }[]) =>
    rows.map((item, idx) => (
      <View
        key={item.label}
        style={[
          styles.tableRow,
          idx === 0 ? styles.tableRowFirst : {},
          { backgroundColor: idx % 2 === 0 ? "#fafdff" : "#f0f6fa" },
        ]}
      >
        <Text style={styles.tableLabel}>{item.label}</Text>
        <Text style={styles.tableValue}>{item.value}</Text>
      </View>
    ));

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.headerContainer}>
          <Image src={logoUrl} style={styles.logo} />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              FACTURA N° {data.numeroFactura || "N/A"}
            </Text>
          </View>
        </View>

        {/* Datos Generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Generales</Text>
          <View style={styles.tableBox}>
            {renderTableRows([
              { label: "Concepto", value: data.concepto || "N/A" },
              { label: "Fecha de Factura", value: formatDate(data.fechaFactura) },
              { label: "Estado", value: data.estado || "N/A" },
              { label: "Total", value: `$${formatDecimal(data.total)}` },
            ])}
          </View>
        </View>

        {/* Items de la Factura */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items de la Factura</Text>
          <View style={styles.tableBox}>
            {data.idLineasFactura?.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  idx === 0 ? styles.tableRowFirst : {},
                  { backgroundColor: idx % 2 === 0 ? "#fafdff" : "#f0f6fa" },
                ]}
              >
                <Text style={styles.tableLabel}>
                  {item.descripcion || "Sin descripción"}
                </Text>
                <Text style={styles.tableValue}>
                  {`$${formatDecimal(item.subTotal)}`}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          Generado el {formatDate(new Date().toString())}
        </Text>
      </Page>
    </Document>
  );
};

export default FacturaTemplate;