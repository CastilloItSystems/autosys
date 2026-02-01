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
import { ChequeoCantidad } from "@/libs/interfaces";

interface ChequeoCantidadTemplateProps {
  data: ChequeoCantidad;
  logoUrl: string;
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
  operationNumber: {
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
  statusBadge: {
    padding: 3,
    borderRadius: 4,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 9,
    minWidth: 60,
    marginTop: 2,
    marginBottom: 2,
    alignSelf: "flex-start",
  },
  statusApproved: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    border: "1px solid #2e7d32",
  },
  statusPending: {
    backgroundColor: "#fff8e1",
    color: "#ff8f00",
    border: "1px solid #ff8f00",
  },
  statusRejected: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    border: "1px solid #c62828",
  },
  section: {
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    backgroundColor: "#f5f5f5",
    padding: 5,
    borderRadius: 4,
    marginBottom: 6,
    fontWeight: "bold",
    fontSize: 11,
    color: "#222",
    textAlign: "left",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 8,
    marginBottom: 14,
    marginTop: 8,
    backgroundColor: "#fafdff",
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderTopColor: "#bbdefb",
  },
  tableCellLabel: {
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: "#e3f2fd",
    padding: 6,
    justifyContent: "center",
  },
  tableCellValue: {
    flex: 2,
    padding: 6,
    textAlign: "left",
    justifyContent: "center",
  },
  signatureContainer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
  },
  signatureBox: {
    width: "45%",
    textAlign: "center",
    fontSize: 9,
  },
  signatureLabel: {
    marginBottom: 10,
    fontWeight: "bold",
  },
  signatureLine: {
    marginVertical: 10,
    fontSize: 12,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 24,
    right: 24,
    textAlign: "center",
    fontSize: 8,
    color: "#888",
  },
});

const formatDate = (dateString: string) => {
  return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
};

const getStatusStyle = (estado: string) => {
  switch (estado?.toLowerCase()) {
    case "aprobado":
      return styles.statusApproved;
    case "pendiente":
      return styles.statusPending;
    case "rechazado":
      return styles.statusRejected;
    default:
      return styles.statusApproved;
  }
};

const ChequeoCantidadTemplate: React.FC<ChequeoCantidadTemplateProps> = ({
  data,
  logoUrl,
}) => {
  // Construye las filas de detalles del chequeo según el tipo
  const detallesChequeoRows = [
    { label: "Tipo", value: data.aplicar.tipo },
    { label: "Producto chequeado", value: data.idProducto?.nombre || "N/A" },
    ...(data.aplicar.tipo.toLowerCase() === "tanque"
      ? [
          { label: "Tanque", value: data.aplicar.idReferencia.nombre },
          { label: "ID Tanque", value: data.aplicar.idReferencia.id },
        ]
      : data.aplicar.tipo.toLowerCase() === "recepcion"
      ? [
          { label: "ID Guía", value: data.aplicar.idReferencia.idGuia },
          { label: "Número de Recepción", value: data.aplicar.idReferencia.numeroRecepcion },
          { label: "Chofer", value: data.aplicar.idReferencia.nombreChofer },
          { label: "Placa", value: data.aplicar.idReferencia.placa },
        ]
      : data.aplicar.tipo.toLowerCase() === "despacho"
      ? [
          { label: "ID Guía", value: data.aplicar.idReferencia.idGuia },
          { label: "Número de Despacho", value: data.aplicar.idReferencia.numeroDespacho },
          { label: "Chofer", value: data.aplicar.idReferencia.nombreChofer },
          { label: "Placa", value: data.aplicar.idReferencia.placa },
        ]
      : [
          { label: "Referencia", value: JSON.stringify(data.aplicar.idReferencia) },
        ]),
  ];

  // Cantidades para tabla
  const cantidadEsperada = data.aplicar.idReferencia?.cantidadEnviada;
  const cantidadRecibida = data.aplicar.idReferencia?.cantidadRecibida;
  const diferencia =
    cantidadEsperada !== undefined && cantidadRecibida !== undefined
      ? cantidadRecibida - cantidadEsperada
      : undefined;
  const diferenciaPorcentaje =
    cantidadEsperada !== undefined && cantidadRecibida !== undefined
      ? ((Math.abs(diferencia ?? 0) / (cantidadEsperada || 1)) * 100)
      : undefined;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.headerContainer}>
          <Image
            src={
              data.idRefineria.img &&
              (data.idRefineria.img.startsWith("http") ||
                data.idRefineria.img.startsWith("data:image"))
                ? data.idRefineria.img
                : logoUrl ||
                  "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRySSMU9Jhl6Uul6j_Y4raxmNj7y129zSrTBZgVoMDQSk1lsmVvL4GhALZ6p-fpFAMIRvKvgLO6g66LhjfLFEeHS29uIGSHBe0n2k-z5LM"
            }
            style={styles.logo}
          />
          <View>
            <Text style={styles.refineryName}>{data.idRefineria.nombre}</Text>
            <Text style={styles.operationNumber}>
              Operación N° {data.numeroChequeoCantidad}
            </Text>
            <Text style={styles.reportDate}>
              Fecha: {formatDate(data.fechaChequeo)}
            </Text>
            <View style={[styles.statusBadge, getStatusStyle(data.estado)]}>
              <Text>{data.estado?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={{ alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "bold", color: "#2c3e50" }}>
            Chequeo de Cantidad
          </Text>
        </View>

        {/* Información principal con visual de tabla */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Chequeo</Text>
          <View style={styles.tableContainer}>
            {detallesChequeoRows.map((item, idx) => (
              <View
                key={item.label}
                style={{
                  flexDirection: "row",
                  backgroundColor: idx % 2 === 0 ? "#fafdff" : "#f0f6fa",
                  borderTopWidth: idx === 0 ? 1 : 0,
                  borderTopColor: "#bbdefb",
                }}
              >
                <View style={styles.tableCellLabel}>
                  <Text style={{ fontSize: 9, color: "#333" }}>{item.label}</Text>
                </View>
                <View style={styles.tableCellValue}>
                  <Text style={{ fontSize: 9, color: "#222", fontWeight: 500 }}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verificación de Cantidades (Bbl)</Text>
          <View style={styles.tableContainer}>
            {data.aplicar.tipo.toLowerCase() === "tanque" ? (
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#fafdff",
                  borderTopWidth: 1,
                  borderTopColor: "#bbdefb",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{
                  flex: 2,
                  borderRightWidth: 1,
                  borderRightColor: "#e3f2fd",
                  padding: 6,
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Text style={{ fontSize: 11, fontWeight: "bold", color: "#333", textAlign: "center" }}>Cantidad</Text>
                </View>
                <View style={{
                  flex: 2,
                  padding: 6,
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "row",
                }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: "#222", textAlign: "center" }}>
                    {data.cantidad?.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "N/A"}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#555", marginLeft: 6, alignSelf: "center" }}>Bbl</Text>
                </View>
              </View>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#fafdff",
                    borderTopWidth: 1,
                    borderTopColor: "#bbdefb",
                    alignItems: "center",
                  }}
                >
                  <View style={{
                    flex: 2,
                    borderRightWidth: 1,
                    borderRightColor: "#e3f2fd",
                    padding: 6,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 9, color: "#333", textAlign: "center" }}>Cantidad Esperada</Text>
                  </View>
                  <View style={{
                    flex: 2,
                    padding: 6,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: "bold", color: "#222", textAlign: "center" }}>
                      {cantidadEsperada !== undefined
                        ? cantidadEsperada.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "N/A"}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#555", marginLeft: 6, alignSelf: "center" }}>Bbl</Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#f0f6fa",
                    borderTopWidth: 1,
                    borderTopColor: "#bbdefb",
                    alignItems: "center",
                  }}
                >
                  <View style={{
                    flex: 2,
                    borderRightWidth: 1,
                    borderRightColor: "#e3f2fd",
                    padding: 6,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 9, color: "#333", textAlign: "center" }}>Cantidad Recibida</Text>
                  </View>
                  <View style={{
                    flex: 2,
                    padding: 6,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: "bold", color: "#222", textAlign: "center" }}>
                      {cantidadRecibida !== undefined
                        ? cantidadRecibida.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "N/A"}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#555", marginLeft: 6, alignSelf: "center" }}>Bbl</Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#fafdff",
                    borderTopWidth: 1,
                    borderTopColor: "#bbdefb",
                    alignItems: "center",
                  }}
                >
                  <View style={{
                    flex: 2,
                    borderRightWidth: 1,
                    borderRightColor: "#e3f2fd",
                    padding: 6,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 9, color: "#333", textAlign: "center" }}>Diferencia</Text>
                  </View>
                  <View style={{
                    flex: 2,
                    padding: 6,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: "bold", color: "#222", textAlign: "center" }}>
                      {diferencia !== undefined
                        ? `${diferencia >= 0 ? "+" : "-"}${Math.abs(diferencia).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${diferenciaPorcentaje !== undefined ? diferenciaPorcentaje.toFixed(2).replace('.', ',') : "0,00"}%)`
                        : "N/A"}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#555", marginLeft: 6, alignSelf: "center" }}>Bbl</Text>
                    <Text style={{ fontSize: 9, color: "#666", marginTop: 2, textAlign: "center", width: "100%" }}>
                      {diferencia !== undefined
                        ? diferencia < 0
                          ? "Faltante"
                          : diferencia > 0
                          ? "Sobrante"
                          : "(Exacto)"
                        : ""}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Información de usuario y fechas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Usuario</Text>
          <View style={styles.tableContainer}>
            {[
              { label: "Creado Por", value: data.createdBy.nombre },
              { label: "Correo", value: data.createdBy.correo },
              { label: "Fecha de creación", value: formatDate(data.createdAt) },
              { label: "Última actualización", value: formatDate(data.updatedAt) },
            ].map((item, idx) => (
              <View
                key={item.label}
                style={{
                  flexDirection: "row",
                  backgroundColor: idx % 2 === 0 ? "#fafdff" : "#f0f6fa",
                  borderTopWidth: idx === 0 ? 1 : 0,
                  borderTopColor: "#bbdefb",
                }}
              >
                <View style={styles.tableCellLabel}>
                  <Text style={{ fontSize: 9, color: "#333" }}>{item.label}</Text>
                </View>
                <View style={styles.tableCellValue}>
                  <Text style={{ fontSize: 9, color: "#222", fontWeight: 500 }}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Firmas */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Responsable de Verificación</Text>
            <Text style={styles.signatureLine}>___________________________</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Supervisor</Text>
            <Text style={styles.signatureLine}>___________________________</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generado el {formatDate(new Date().toString())} | Página 1 de 1
        </Text>
      </Page>
    </Document>
  );
};

export default ChequeoCantidadTemplate;