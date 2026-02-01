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
import { Contrato } from "@/libs/interfaces";

interface ContratoTemplateProps {
  data: Contrato;
  logoUrl: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  contractTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
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
  refineryName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 1,
    textAlign: "left",
  },
  operationNumber: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#3498db",
    marginBottom: 1,
    textAlign: "left",
  },
  reportDate: {
    fontSize: 8,
    color: "#888",
    marginBottom: 1,
    textAlign: "left",
  },
  statusBadge: {
    padding: 2,
    borderRadius: 4,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 8,
    minWidth: 48,
    marginTop: 1,
    marginBottom: 1,
    alignSelf: "flex-start",
  },
  statusActive: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    border: "1px solid #2e7d32",
  },
  statusPending: {
    backgroundColor: "#fff8e1",
    color: "#ff8f00",
    border: "1px solid #ff8f00",
  },
  statusClosed: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    border: "1px solid #c62828",
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
    justifyContent: "center",
    alignItems: "flex-start",
    fontSize: 8,
    color: "#333",
    textAlign: "left",
    fontWeight: "bold",
  },
  tableValue: {
    flex: 2,
    padding: 3,
    justifyContent: "center",
    alignItems: "flex-start",
    fontSize: 8,
    color: "#222",
    fontWeight: 500,
    textAlign: "left",
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
    padding: 2,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: "#bbb",
    textAlign: "center",
    overflow: "hidden",
  },
  tableCellLast: {
    padding: 2,
    fontSize: 8,
    textAlign: "center",
    overflow: "hidden",
  },
  signatureContainer: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
  },
  signatureBox: {
    width: "45%",
    textAlign: "center",
    fontSize: 8,
  },
  signatureLabel: {
    marginBottom: 6,
    fontWeight: "bold",
  },
  signatureLine: {
    marginVertical: 6,
    fontSize: 10,
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

const getStatusStyle = (estado: string) => {
  switch (estado?.toLowerCase()) {
    case "activo":
      return styles.statusActive;
    case "pendiente":
      return styles.statusPending;
    case "cerrado":
    case "finalizado":
      return styles.statusClosed;
    default:
      return styles.statusActive;
  }
};

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

const ContratoTemplate: React.FC<ContratoTemplateProps> = ({
  data,
  logoUrl,
}) => {
  const refineryLogo =
    data.idRefineria?.img &&
    (data.idRefineria.img.startsWith("http") || data.idRefineria.img.startsWith("data:image"))
      ? data.idRefineria.img
      : logoUrl ||
        "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRySSMU9Jhl6Uul6j_Y4raxmNj7y129zSrTBZgVoMDQSk1lsmVvL4GhALZ6p-fpFAMIRvKvgLO6g66LhjfLFEeHS29uIGSHBe0n2k-z5LM";

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
      {/* Página 1: Datos generales */}
      <Page size="A4" orientation="portrait" style={styles.page}>
       {/* Encabezado */}
<View style={styles.headerContainer}>
  <Image src={refineryLogo} style={styles.logo} />
  <View style={styles.titleContainer}>
   
    
    <Text style={styles.refineryName}>{data.idRefineria?.nombre || "Refinería"}</Text>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <Text style={styles.reportDate}>
        Estado: {data.estadoContrato}
      </Text>
      <View style={[styles.statusBadge, getStatusStyle(data.estadoContrato)]}>
        <Text>{data.estadoContrato?.toUpperCase()}</Text>
      </View>
      
    </View>
  </View>
   {/* Nuevo título del contrato */}
    <Text style={styles.contractTitle}>
      CONTRATO DE {data.tipoContrato?.toUpperCase() || "COMPRA/VENTA"} N° {data.numeroContrato}
    </Text>
</View>

        {/* Datos del contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Contacto</Text>
          <View style={styles.tableBox}>
            {renderTableRows([
              { label: "Nombre", value: data.idContacto?.nombre || "N/A" },
              { label: "Identificación Fiscal", value: data.idContacto?.identificacionFiscal || "N/A" },
              { label: "Representante Legal", value: data.idContacto?.representanteLegal || "N/A" },
              { label: "Teléfono", value: data.idContacto?.telefono || "N/A" },
              { label: "Correo", value: data.idContacto?.correo || "N/A" },
              { label: "Dirección", value: data.idContacto?.direccion || "N/A" },
            ])}
          </View>
        </View>

        {/* Condiciones del contrato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condiciones del Contrato</Text>
          <View style={styles.tableBox}>
            {renderTableRows([
              { label: "Tipo de Contrato", value: data.tipoContrato || "N/A" },
              { label: "Descripción", value: data.descripcion || "N/A" },
              { label: "Estado de Entrega", value: data.estadoEntrega || "N/A" },
              {
                label: "Condición de Pago",
                value:
                  (data.condicionesPago?.tipo || "N/A") +
                  (data.condicionesPago && typeof data.condicionesPago.plazo === "number" && data.condicionesPago.plazo > 0
                    ? ` - ${data.condicionesPago.plazo} días`
                    : ""),
              },
              { label: "Fecha de Inicio", value: formatDate(data.fechaInicio) },
              { label: "Fecha de Fin", value: formatDate(data.fechaFin) },
              { label: "Precio Brent Acordado", value: formatDecimal(data.brent) },
            ])}
          </View>
        </View>

        {/* Totales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Totales</Text>
          <View style={styles.tableBox}>
            {renderTableRows([
              { label: "Monto Total", value: formatDecimal(data.montoTotal) },
              { label: "Monto Pagado", value: formatDecimal(data.montoPagado) },
              { label: "Monto Pendiente", value: formatDecimal(data.montoPendiente) },
            ])}
          </View>
        </View>

        {/* Información de usuario y fechas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuario</Text>
          <View style={styles.tableBox}>
            {renderTableRows([
              { label: "Creado por", value: data.createdBy?.nombre || "N/A" },
              { label: "Correo", value: data.createdBy?.correo || "N/A" },
              { label: "Creación", value: formatDate(data.createdAt) },
              { label: "Actualización", value: formatDate(data.updatedAt) },
            ])}
          </View>
        </View>

        <Text style={styles.footer}>
          Generado el {formatDate(new Date().toString())} | Página 1 de 2
        </Text>
      </Page>

      {/* Página 2: Productos */}
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Características de los Productos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Características de los Productos</Text>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableCell, flex: 1.1 }}>Producto</Text>
            <Text style={{ ...styles.tableCell, flex: 1 }}>Tipo</Text>
            <Text style={{ ...styles.tableCell, flex: 1 }}>Clasificación</Text>
            <Text style={{ ...styles.tableCell, flex: 0.8 }}>Cantidad</Text>
            <Text style={{ ...styles.tableCell, flex: 0.8 }}>Gravedad API</Text>
            <Text style={{ ...styles.tableCell, flex: 0.8 }}>Azufre (%)</Text>
            <Text style={{ ...styles.tableCell, flex: 0.8 }}>Agua (%)</Text>
            <Text style={{ ...styles.tableCellLast, flex: 1 }}>P. Inflamación (°C)</Text>
          </View>
          {data.idItems?.map((item: any, idx: number) => (
            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" }} key={item._id || idx}>
              <Text style={{ ...styles.tableCell, flex: 1.1 }}>
                {item.producto?.nombre}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>{item.idTipoProducto?.nombre}</Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>{item.clasificacion}</Text>
              <Text style={{ ...styles.tableCell, flex: 0.8 }}>{item.cantidad}</Text>
              <Text style={{ ...styles.tableCell, flex: 0.8 }}>{item.gravedadAPI}</Text>
              <Text style={{ ...styles.tableCell, flex: 0.8 }}>{item.azufre}</Text>
              <Text style={{ ...styles.tableCell, flex: 0.8 }}>{item.contenidoAgua}</Text>
              <Text style={{ ...styles.tableCellLast, flex: 1 }}>{item.puntoDeInflamacion}</Text>
            </View>
          ))}
        </View>

        {/* Valores Monetarios de los Productos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valores Monetarios de los Productos</Text>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableCell, flex: 1.1 }}>Producto</Text>
            <Text style={{ ...styles.tableCell, flex: 0.8 }}>Cantidad (Bbl)</Text>
            <Text style={{ ...styles.tableCell, flex: 1 }}>Precio Unitario</Text>
            <Text style={{ ...styles.tableCell, flex: 1 }}>Convenio</Text>
            <Text style={{ ...styles.tableCell, flex: 1 }}>Transporte</Text>
            <Text style={{ ...styles.tableCellLast, flex: 1 }}>Subtotal</Text>
          </View>
          {data.idItems?.map((item: any, idx: number) => {
            const cantidad = Number(item.cantidad) || 0;
            const precioUnitario = Number(item.precioUnitario) || 0;
            const convenio = Number(item.convenio) || 0;
            const transporte = Number(item.montoTransporte) || 0;
            const subtotal = precioUnitario * cantidad;
            return (
              <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" }} key={item._id || idx}>
                <Text style={{ ...styles.tableCell, flex: 1.1 }}>
                  {item.producto?.nombre}
                </Text>
                <Text style={{ ...styles.tableCell, flex: 0.8 }}>
                  {cantidad.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={{ ...styles.tableCell, flex: 1 }}>{formatDecimal(precioUnitario)}</Text>
                <Text style={{ ...styles.tableCell, flex: 1 }}>{formatDecimal(convenio)}</Text>
                <Text style={{ ...styles.tableCell, flex: 1 }}>{formatDecimal(transporte)}</Text>
                <Text style={{ ...styles.tableCellLast, flex: 1 }}>{formatDecimal(subtotal)}</Text>
              </View>
            );
          })}

          {/* Suma de los valores monetarios */}
          {(() => {
            let totalCantidad = 0;
            let totalPrecioUnitario = 0;
            let totalSubtotal = 0;
            data.idItems?.forEach((item: any) => {
              const cantidad = Number(item.cantidad) || 0;
              const precioUnitario = Number(item.precioUnitario) || 0;
              const subtotal = precioUnitario * cantidad;
              totalCantidad += cantidad;
              totalPrecioUnitario += precioUnitario;
              totalSubtotal += subtotal;
            });
            return (
              <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: "#bbb", backgroundColor: "#f5f5f5" }}>
                <Text style={{ ...styles.tableCell, flex: 1.1, fontWeight: "bold" }}>Totales</Text>
                <Text style={{ ...styles.tableCell, flex: 0.8, fontWeight: "bold" }}>{formatDecimal(totalCantidad)}</Text>
                <Text style={{ ...styles.tableCell, flex: 1, fontWeight: "bold" }}>{formatDecimal(totalPrecioUnitario)}</Text>
                <Text style={{ ...styles.tableCell, flex: 1 }}></Text>
                <Text style={{ ...styles.tableCell, flex: 1 }}></Text>
                <Text style={{ ...styles.tableCellLast, flex: 1, fontWeight: "bold" }}>{formatDecimal(totalSubtotal)}</Text>
              </View>
            );
          })()}
        </View>

        {/* Firmas */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Representante Legal</Text>
            <Text style={styles.signatureLine}>___________________________</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Contraparte</Text>
            <Text style={styles.signatureLine}>___________________________</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generado el {formatDate(new Date().toString())} | Página 2 de 2
        </Text>
      </Page>
    </Document>
  );
};

export default ContratoTemplate;