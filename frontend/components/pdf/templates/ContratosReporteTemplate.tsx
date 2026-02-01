
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ContratosReporteTemplateProps {
  data: any[];
  logoUrl?: string;
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
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
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
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e3f2fd",
    borderTopWidth: 1,
    borderTopColor: "#bbb",
    borderBottomWidth: 1,
    borderBottomColor: "#bbb",
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    padding: 3,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: "#e3f2fd",
    textAlign: "center",
    overflow: "hidden",
  },
  tableCellLast: {
    flex: 1,
    padding: 3,
    fontSize: 8,
    textAlign: "center",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#bbdefb",
  },
  rowFirst: {
    borderTopWidth: 0,
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

const ContratosReporteTemplate: React.FC<ContratosReporteTemplateProps> = ({ data = [], logoUrl }) => {
  // Selecciona el logo de la refinería del primer contrato si existe, si no usa el prop logoUrl, si no, usa el default
  let refineryLogo = logoUrl || "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRySSMU9Jhl6Uul6j_Y4raxmNj7y129zSrTBZgVoMDQSk1lsmVvL4GhALZ6p-fpFAMIRvKvgLO6g66LhjfLFEeHS29uIGSHBe0n2k-z5LM";
  if (data && data.length > 0 && data[0].idRefineria?.img) {
    const img = data[0].idRefineria.img;
    if (img.startsWith("http") || img.startsWith("data:image")) {
      refineryLogo = img;
    }
  }

  return (
    <Document>
      <Page style={styles.page} size="A4">
        {/* Encabezado */}
        <View style={styles.headerContainer}>
          <Image src={refineryLogo} style={styles.logo} />
          <View style={styles.titleContainer}>
            <Text style={styles.reportTitle}>REPORTE GENERAL DE CONTRATOS</Text>
          </View>
        </View>

        {/* Tabla de contratos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listado de Contratos</Text>
          <View style={styles.tableBox}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCell}>N°</Text>
              <Text style={styles.tableCell}>Proveedor/Cliente</Text>
              <Text style={styles.tableCell}>Tipo</Text>
              <Text style={styles.tableCell}>Estado</Text>
              <Text style={styles.tableCell}>Entrega</Text>
              <Text style={styles.tableCell}>Fecha Inicio</Text>
              <Text style={styles.tableCell}>Fecha Fin</Text>
              <Text style={styles.tableCell}>Monto $ </Text>
              <Text style={styles.tableCellLast}>Saldo $</Text>
            </View>
            {data.map((c, i) => (
              <View style={[styles.row, i === 0 ? styles.rowFirst : {}, { backgroundColor: i % 2 === 0 ? "#fafdff" : "#f0f6fa" }]} key={i}>
                <Text style={styles.tableCell}>{c.numeroContrato}</Text>
                <Text style={styles.tableCell}>{c.idContacto?.nombre}</Text>
                <Text style={styles.tableCell}>{c.tipoContrato}</Text>
                <Text style={styles.tableCell}>{c.estadoContrato}</Text>
                <Text style={styles.tableCell}>{c.estadoEntrega}</Text>
                <Text style={styles.tableCell}>{c.fechaInicio ? format(new Date(c.fechaInicio), "dd/MM/yyyy", { locale: es }) : ""}</Text>
                <Text style={styles.tableCell}>{c.fechaFin ? format(new Date(c.fechaFin), "dd/MM/yyyy", { locale: es }) : ""}</Text>
                <Text style={styles.tableCell}>{typeof c.montoTotal === 'number' ? c.montoTotal.toLocaleString('es-ES', { minimumFractionDigits: 0 }) : c.montoTotal}</Text>
                <Text style={styles.tableCellLast}>{typeof c.montoPendiente === 'number' ? c.montoPendiente.toLocaleString('es-ES', { minimumFractionDigits: 0 }) : c.montoPendiente}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          Generado el {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
        </Text>
      </Page>
    </Document>
  );
};

export default ContratosReporteTemplate;
