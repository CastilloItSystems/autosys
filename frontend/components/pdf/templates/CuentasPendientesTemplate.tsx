import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 11,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 8,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    color: "#2563eb",
    fontWeight: "bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  table: {
    width: "auto",
    marginTop: 16,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e0e7ef",
    borderRadius: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e7ef",
    borderBottomStyle: "solid",
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#e3f2fd",
    fontWeight: "bold",
  },
  tableCell: {
    padding: 6,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: "#e0e7ef",
    borderRightStyle: "solid",
    flexGrow: 1,
    textAlign: "left",
  },
  tableCellRight: {
    textAlign: "right",
    fontWeight: "bold",
    color: "#d32f2f",
  },
  totalRow: {
    backgroundColor: "#e3f2fd",
    fontWeight: "bold",
  },
});

interface CuentasPendientesTemplateProps {
  data: {
    tipoCuenta: string;
    cuentas: any[];
    totalPendiente: number;
  };
  logoUrl?: string;
}

const CuentasPendientesTemplate: React.FC<CuentasPendientesTemplateProps> = ({
  data,
  logoUrl,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        {logoUrl && (
          <Image src={logoUrl} style={styles.logo} />
        )}
        <View>
          <Text style={styles.title}>
            Reporte de {data.tipoCuenta} Pendientes
          </Text>
          <Text style={styles.subtitle}>
            Fecha de generación: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, { flex: 1.2 }]}>Contrato</Text>
          <Text style={[styles.tableCell, { flex: 2 }]}>Descripción</Text>
          <Text style={[styles.tableCell, { flex: 1.5 }]}>Cliente/Proveedor</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>Monto Total</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>Total Abonado</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>Pendiente</Text>
        </View>
        {data.cuentas.map((c: any) => (
          <View style={styles.tableRow} key={c._id}>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>
              {c.idContrato?.numeroContrato}
            </Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {c.idContrato?.descripcion}
            </Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>
              {c.idContacto?.nombre}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
              {c.montoTotalContrato?.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
              {c.totalAbonado?.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1 }]}>
              {c.balancePendiente?.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ))}
        <View style={[styles.tableRow, styles.totalRow]}>
          <Text style={[styles.tableCell, { flex: 5.7, textAlign: "right" }]}>
            Total Pendiente:
          </Text>
          <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1 }]}>
            {data.totalPendiente.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default CuentasPendientesTemplate;