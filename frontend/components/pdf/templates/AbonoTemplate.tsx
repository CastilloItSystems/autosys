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

interface AbonoTemplateProps {
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

const capitalizeFirst = (text: string) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};


const AbonoTemplate: React.FC<AbonoTemplateProps> = ({
  data,
  logoUrl,
}) => {
  // Selecciona el logo de la refinería desde idRefineria.img si existe, si no usa el prop logoUrl, si no, usa el default
  const refineryLogo =
    data.idRefineria?.img &&
    (data.idRefineria.img.startsWith("http") || data.idRefineria.img.startsWith("data:image"))
      ? data.idRefineria.img
      : logoUrl ||
        "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRySSMU9Jhl6Uul6j_Y4raxmNj7y129zSrTBZgVoMDQSk1lsmVvL4GhALZ6p-fpFAMIRvKvgLO6g66LhjfLFEeHS29uIGSHBe0n2k-z5LM";

  const contrato = data.idContrato || {};
  const contacto = contrato.idContacto || {};

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
    {/* Título del reporte con la primera letra en mayúscula */}
    <Text style={styles.operationNumber}>
      {capitalizeFirst("Abono N° " + (data.numeroAbono ?? ""))}
    </Text>
    <Text style={styles.reportDate}>
      Fecha: {formatDate(data.fecha)}
    </Text>
  </View>
</View>

        {/* Información del Contacto */}
        {contacto && Object.keys(contacto).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Contacto</Text>
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
              {/* Filas sin encabezados */}
              {[
                { label: "Nombre", value: contacto.nombre || "N/A" },
                { label: "Representante Legal", value: contacto.representanteLegal || "N/A" },
                { label: "Teléfono", value: contacto.telefono || "N/A" },
                { label: "Correo", value: contacto.correo || "N/A" },
                { label: "Dirección", value: contacto.direccion || "N/A" },
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
                    alignItems: "flex-start", // alineación a la izquierda
                  }}>
                    <Text style={{ fontSize: 9, color: "#333", textAlign: "left" }}>{item.label}</Text>
                  </View>
                  <View style={{
                    flex: 2,
                    padding: 6,
                    justifyContent: "center",
                    alignItems: "flex-start", // alineación a la izquierda
                  }}>
                    <Text style={{ fontSize: 9, color: "#222", fontWeight: 500, textAlign: "left" }}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

          {/* Información del Abono */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Abono</Text>
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
            {/* Filas sin encabezados */}
            {[
              { label: "Número de Contrato", value: contrato.numeroContrato || "N/A" },
              { label: "Descripción Contrato", value: contrato.descripcion || "N/A" },
              { label: "Monto Total Contrato", value: contrato.montoTotal !== undefined ? `${formatDecimal(contrato.montoTotal)}` : "N/A" },
              { label: "Monto del Abono", value: data.monto !== undefined ? `${formatDecimal(data.monto)}` : "N/A" },
              { label: "Monto Pagado Contrato (Contando Anteriores Abono)", value: contrato.montoPagado !== undefined ? `${formatDecimal(contrato.montoPagado)}` : "N/A" },
              { label: "Monto Pendiente Contrato", value: contrato.montoPendiente !== undefined ? `${formatDecimal(contrato.montoPendiente)}` : "N/A" },
              { label: "Tipo de Operación", value: data.tipoOperacion || "N/A" },
              { label: "Referencia", value: data.referencia || "N/A" },
              { label: "Creado por", value: data.createdBy?.nombre || "N/A" },
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
                  alignItems: "flex-start", // alineación a la izquierda
                }}>
                  <Text style={{ fontSize: 9, color: "#333", textAlign: "left" }}>{item.label}</Text>
                </View>
                <View style={{
                  flex: 2,
                  padding: 6,
                  justifyContent: "center",
                  alignItems: "flex-start", // alineación a la izquierda
                }}>
                  <Text style={{ fontSize: 9, color: "#222", fontWeight: 500, textAlign: "left" }}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Firmas */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Responsable de Abono</Text>
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

export default AbonoTemplate;