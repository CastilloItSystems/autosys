
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
    borderBottomWidth: 1,
    borderBottomColor: "#3498db",
    paddingBottom: 6,
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 10,
  },
  refineryName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 2,
    textAlign: "left",
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#3498db",
    marginBottom: 2,
    textAlign: "left",
  },
  reportDate: {
    fontSize: 9,
    color: "#888",
    marginBottom: 2,
    textAlign: "left",
  },
  table: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 6,
    // overflow no es soportado por react-pdf
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 22,
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#3498db",
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: "#222",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#e3f2fd",
    textAlign: "left",
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
});

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
};


interface ContactosReporteTemplateProps {
  data: any[];
  logoUrl: string;
}

const ContactosReporteTemplate: React.FC<ContactosReporteTemplateProps> = ({ data, logoUrl }) => {
  const refineryName = data[0]?.idRefineria?.nombre || "Refinería";
  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.headerContainer}>
          {logoUrl && <Image src={logoUrl} style={styles.logo} />}
          <View>
            <View style={{ alignItems: "center" }}>
                <Text style={styles.refineryName}>{refineryName}</Text>
                <Text style={styles.reportTitle}>Reporte de Contactos</Text>
            </View>
            <Text style={styles.reportDate}>Fecha: {formatDate(new Date().toString())}</Text>
          </View>
        </View>

        {/* Tabla de contactos */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Nombre</Text>
            <Text style={styles.tableCell}>Tipo</Text>
            <Text style={styles.tableCell}>Correo</Text>
            <Text style={[styles.tableCell, styles.tableCellLast]}>Teléfono</Text>
          </View>
          {data.map((c, idx) => (
            <View
              key={c._id || idx}
              style={{
                ...styles.tableRow,
                backgroundColor: idx % 2 === 0 ? "#fafdff" : "#f0f6fa",
              }}
            >
              <Text style={styles.tableCell}>{c.nombre}</Text>
              <Text style={styles.tableCell}>{c.tipo}</Text>
              <Text style={styles.tableCell}>{c.correo}</Text>
              <Text style={[styles.tableCell, styles.tableCellLast]}>{c.telefono}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default ContactosReporteTemplate;
