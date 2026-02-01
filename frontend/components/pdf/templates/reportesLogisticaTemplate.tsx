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

interface RecepcionTemplateProps {
  data: any;
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
  row: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "flex-start",
  },
  label: {
    width: "38%",
    fontWeight: "bold",
    color: "#555",
    fontSize: 9,
    textAlign: "left",
    paddingRight: 6,
  },
  value: {
    width: "62%",
    fontSize: 9,
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
  statusRejected: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    border: "1px solid #c62828",
  },
  calidadBox: {
    backgroundColor: "#e3f2fd",
    border: "1px solid #bbdefb",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    marginBottom: 10,
  },
  calidadLabel: {
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 6,
    textAlign: "center",
  },
  calidadValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
  },
  calidadUnidad: {
    fontSize: 10,
    color: "#555",
    marginTop: 4,
    textAlign: "center",
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

const getEstadoColor = (estado: string) => {
  switch ((estado || "").toUpperCase()) {
    case "COMPLETADO":
      return "#2e7d32"; // Verde
    case "EN REFINERIA":
      return "#e6b800"; // Amarillo
    case "CANCELADO":
      return "#c62828"; // Rojo
    default:
      return "#222"; // Negro
  }
};

const RecepcionTemplate: React.FC<RecepcionTemplateProps> = ({
  data,
  logoUrl,
}) => {
  const contrato = data.idContrato || {};
  const producto = contrato.idItems?.[0] || data.idContratoItems || {};

  // Chequeo de calidad/cantidad y estado
  const chequeoCalidad = producto || {};
  const chequeoCantidad = {
    cantidadEsperada: data.cantidadEnviada,
    cantidadRecibida: data.cantidadRecibida,
    aprobado: data.estadoRecepcion?.toLowerCase() === "aprobado",
  };

  // Selecciona el logo de la refinería si existe, si no usa el prop logoUrl, si no, usa el default
  const refineryLogo =
    data.idRefineria?.img &&
    (data.idRefineria.img.startsWith("http") || data.idRefineria.img.startsWith("data:image"))
      ? data.idRefineria.img
      : logoUrl ||
        "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRySSMU9Jhl6Uul6j_Y4raxmNj7y129zSrTBZgVoMDQSk1lsmVvL4GhALZ6p-fpFAMIRvKvgLO6g66LhjfLFEeHS29uIGSHBe0n2k-z5LM";

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.headerContainer}>
          <Image
            src={refineryLogo}
            style={styles.logo}
          />
          <View>
            <Text style={styles.refineryName}>{data.idRefineria?.nombre || "Refinería"}</Text>
            <Text style={styles.operationNumber}>
              Recepción N° {data.numeroRecepcion}
            </Text>
            <Text
              style={{
                ...styles.reportDate,
                color: getEstadoColor(data.estadoRecepcion),
                fontWeight: "bold",
              }}
            >
              Estado: {data.estadoRecepcion}
            </Text>
          </View>
        </View>

        {/* ...resto del template igual... */}
        {/* Información de la Recepción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de la Recepción</Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: "#3498db",
              borderRadius: 8,
              marginBottom: 14,
              marginTop: 8,
              backgroundColor: "#fafdff",
              overflow: "hidden",
            }}
          >
            {/* Encabezados */}
            <View style={{ flexDirection: "row", backgroundColor: "#e3f2fd" }}>
              <View style={{
                flex: 2,
                borderRightWidth: 1,
                borderRightColor: "#bbdefb",
                padding: 6,
                justifyContent: "center",
                alignItems: "center",
              }}>
                <Text style={{ fontWeight: "bold", fontSize: 10, color: "#1976d2", letterSpacing: 0.5 }}>INFORMACIÓN</Text>
              </View>
              <View style={{
                flex: 2,
                padding: 6,
                textAlign: "center",
                justifyContent: "center",
                alignItems: "center",
              }}>
                <Text style={{ fontWeight: "bold", fontSize: 10, color: "#1976d2", letterSpacing: 0.5 }}>VALOR</Text>
              </View>
            </View>
            {/* Fila */}
            {[
              { label: "Número de Contrato", value: contrato.numeroContrato || "N/A" },
              { label: "Producto que recibe", value: producto.producto?.nombre || producto.producto || "N/A" },
              { label: "Cantidad Esperada", value: `${formatDecimal(data.cantidadEnviada)} Bbl` },
              { label: "Cantidad Recibida", value: `${formatDecimal(data.cantidadRecibida)} Bbl` },
              { label: "ID Guía", value: data.idGuia || "N/A" },
              { label: "Placa", value: data.placa || "N/A" },
              { label: "Nombre del Chofer", value: data.nombreChofer || "N/A" },
              { label: "Fecha de Inicio de Recepción", value: formatDate(data.fechaInicioRecepcion) },
              { label: "Fecha Fin de Recepción", value: formatDate(data.fechaFinRecepcion) },
              { label: "Línea de Descarga", value: data.idLinea?.nombre || "N/A" },
              { label: "Tanque Destino", value: data.idTanque?.nombre || "N/A" },
            ].map((item, idx, arr) => (
              <View
                key={item.label}
                style={{
                  flexDirection: "row",
                  backgroundColor: idx % 2 === 0 ? "#fafdff" : "#f0f6fa",
                  borderTopWidth: idx === 0 ? 1 : 0,
                  borderTopColor: "#bbdefb",
                }}
              >
                <View style={{
                  flex: 2,
                  borderRightWidth: 1,
                  borderRightColor: "#e3f2fd",
                  padding: 6,
                  justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 9, color: "#333" }}>{item.label}</Text>
                </View>
                <View style={{
                  flex: 2,
                  padding: 6,
                  textAlign: "center",
                  justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 9, color: "#222", fontWeight: 500 }}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ...resto del template igual... */}
        {/* Resultados de Calidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resultados de Calidad</Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: "#3498db",
              borderRadius: 8,
              marginBottom: 14,
              marginTop: 8,
              backgroundColor: "#fafdff",
              overflow: "hidden",
            }}
          >
            {/* Encabezados */}
            <View style={{ flexDirection: "row", backgroundColor: "#e3f2fd" }}>
              <View style={{
                flex: 2,
                borderRightWidth: 1,
                borderRightColor: "#bbdefb",
                padding: 6,
                justifyContent: "center",
                alignItems: "center",
              }}>
                <Text style={{ fontWeight: "bold", fontSize: 10, color: "#1976d2", letterSpacing: 0.5 }}>PARÁMETRO</Text>
              </View>
              <View style={{
                flex: 2,
                padding: 6,
                textAlign: "center",
                justifyContent: "center",
                alignItems: "center",
              }}>
                <Text style={{ fontWeight: "bold", fontSize: 10, color: "#1976d2", letterSpacing: 0.5 }}>VALOR</Text>
              </View>
            </View>
            {/* Filas */}
            {[
              { label: "Gravedad API", value: chequeoCalidad.gravedadAPI !== undefined ? chequeoCalidad.gravedadAPI : "N/A", unidad: "°API" },
              { label: "% de Azufre", value: chequeoCalidad.azufre !== undefined ? chequeoCalidad.azufre : "N/A", unidad: "%" },
              { label: "Contenido de Agua", value: chequeoCalidad.contenidoAgua !== undefined ? chequeoCalidad.contenidoAgua : "N/A", unidad: "%" },
              { label: "Punto de Inflamación", value: chequeoCalidad.puntoDeInflamacion !== undefined ? chequeoCalidad.puntoDeInflamacion : "N/A", unidad: "°C" },
              { label: "Índice de Cetano", value: chequeoCalidad.cetano !== undefined ? chequeoCalidad.cetano : "N/A", unidad: "" },
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
                <View style={{
                  flex: 2,
                  borderRightWidth: 1,
                  borderRightColor: "#e3f2fd",
                  padding: 6,
                  justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 9, color: "#333" }}>{item.label}</Text>
                </View>
                <View style={{
                  flex: 2,
                  padding: 6,
                  textAlign: "center",
                  justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 9, color: "#222", fontWeight: 500 }}>
                    {item.value} {item.unidad}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          {/* Estado de aprobación de calidad */}
          <View style={styles.row}>
            <Text style={styles.label}>¿Aprobado?</Text>
            <View style={[
              styles.statusBadge,
              chequeoCalidad.aprobado ? styles.statusApproved : styles.statusRejected,
            ]}>
              <Text>
                {chequeoCalidad.aprobado ? "APROBADO" : "RECHAZADO"}
              </Text>
            </View>
          </View>
        </View>

        {/* Chequeo de Cantidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chequeo de Cantidad</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cantidad Esperada (Bbl):</Text>
            <Text style={styles.value}>{formatDecimal(chequeoCantidad.cantidadEsperada)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cantidad Recibida (Bbl):</Text>
            <Text style={styles.value}>{formatDecimal(chequeoCantidad.cantidadRecibida)}</Text>
          </View>
        </View>

        {/* Firmas */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Responsable Recepción</Text>
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

export default RecepcionTemplate;