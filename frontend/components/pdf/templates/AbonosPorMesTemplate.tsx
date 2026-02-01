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

interface AbonosPorMesTemplateProps {
  data: any;
  logoUrl: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  tipoAbono?: string;
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
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3498db",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
    letterSpacing: 0.5,
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
  tableContainer: {
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 8,
    marginBottom: 14,
    marginTop: 8,
    backgroundColor: "#fafdff",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e3f2fd",
  },
  tableHeaderCell: {
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: "#bbdefb",
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  tableHeaderCellValor: {
    flex: 2,
    padding: 6,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
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
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#e3f2fd",
    borderTopWidth: 1,
    borderTopColor: "#3498db",
    fontWeight: "bold",
  },
  totalLabel: {
    flex: 2,
    padding: 6,
    fontWeight: "bold",
    color: "#1976d2",
    fontSize: 11,
    textAlign: "right",
  },
  totalValue: {
    flex: 2,
    padding: 6,
    fontWeight: "bold",
    color: "#1976d2",
    fontSize: 11,
    textAlign: "left",
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


// Utilidad para poner la primera letra en mayúscula
function capitalizeFirst(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}
// Agrupa abonos por cliente (nombre de contacto)
function groupAbonosByCliente(abonos: any[]) {
  const map: Record<string, any> = {};
  abonos.forEach((abono) => {
    const cliente =
      abono.idContrato?.idContacto?.nombre ||
      abono.idContrato?.idContacto?.representanteLegal ||
      "Cliente Desconocido";
    if (!map[cliente]) {
      map[cliente] = {
        cliente,
        monto: 0,
        contratos: {},
        refineria: abono.idRefineria,
      };
    }
    map[cliente].monto += abono.monto ?? 0;

    // Agrupa por contrato dentro del cliente
    const contratoNum = abono.idContrato?.numeroContrato || "N/A";
    if (!map[cliente].contratos[contratoNum]) {
      map[cliente].contratos[contratoNum] = {
        numeroContrato: contratoNum,
        descripcion: abono.idContrato?.descripcion || "",
        montoTotal: abono.idContrato?.montoTotal ?? 0,
        montoPagado: abono.idContrato?.montoPagado ?? 0,
        montoPendiente: abono.idContrato?.montoPendiente ?? 0,
        abonos: [],
      };
    }
    map[cliente].contratos[contratoNum].abonos.push(abono);
  });
  return Object.values(map);
}

const AbonosPorMesTemplate: React.FC<AbonosPorMesTemplateProps> = ({
  data,
  logoUrl,
  fechaInicio,
  fechaFin,
  tipoAbono,
}) => {
  const refineryLogo =
    data.abonos[0]?.idRefineria?.img &&
    (data.abonos[0].idRefineria.img.startsWith("http") ||
      data.abonos[0].idRefineria.img.startsWith("data:image"))
      ? data.abonos[0].idRefineria.img
      : logoUrl ||
        "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRySSMU9Jhl6Uul6j_Y4raxmNj7y129zSrTBZgVoMDQSk1lsmVvL4GhALZ6p-fpFAMIRvKvgLO6g66LhjfLFEeHS29uIGSHBe0n2k-z5LM";

  const clientes = groupAbonosByCliente(data.abonos);

  // Determinar si es ingresos o egresos usando la prop tipoAbono
  const tipo =
    tipoAbono === "Cuentas por Cobrar"
      ? "ingresos"
      : tipoAbono === "Cuentas por Pagar"
      ? "egresos"
      : "abonos";

  // Formatear fechas del periodo usando las props
  const periodo =
    fechaInicio && fechaFin
      ? `${format(fechaInicio, "dd/MM/yyyy")} al ${format(fechaFin, "dd/MM/yyyy")}`
      : "";

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.headerContainer}>
          <Image src={refineryLogo} style={styles.logo} />
          <View>
            <Text style={styles.refineryName}>
              {data.abonos[0]?.idRefineria?.nombre || "Refinería"}
            </Text>
            <Text style={styles.reportDate}>
              Fecha de reporte: {formatDate(new Date().toString())}
            </Text>
          </View>
        </View>

        {/* Título del reporte */}
     <Text style={styles.reportTitle}>
  {capitalizeFirst(`Resumen De Abonos De ${capitalizeFirst(tipo)} Del Periodo`)}
</Text>
{periodo && (
  <Text style={{ textAlign: "center", fontSize: 12, color: "#555", marginBottom: 8 }}>
    {periodo}
  </Text>
)}


        {/* Resumen general */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          <View style={styles.tableContainer}>
            <View style={styles.tableRow}>
              <View style={styles.tableCellLabel}>
                <Text style={{ fontWeight: "bold" }}>Cantidad de Abonos Realizados</Text>
              </View>
              <View style={styles.tableCellValue}>
                <Text>{data.cantidad}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCellLabel}>
                <Text style={{ fontWeight: "bold" }}>Monto Total pagado en el periodo</Text>
              </View>
              <View style={styles.tableCellValue}>
                <Text>{formatDecimal(data.totalMonto)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabla de abonos agrupados por cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle por Cliente</Text>
          {clientes.map((cliente: any, idx: number) => (
            <View key={cliente.cliente} style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "bold", fontSize: 11, color: "#1976d2", marginBottom: 2 }}>
                {cliente.cliente}
              </Text>
              <View style={styles.tableContainer}>
                {/* Por cada contrato del cliente */}
                {Object.values(cliente.contratos).map((contrato: any, cidx: number) => (
                  <View key={contrato.numeroContrato} style={{ marginBottom: 4 }}>
                    <View style={styles.tableRow}>
                      <View style={styles.tableCellLabel}>
                        <Text style={{ fontWeight: "bold" }}>
                          Contrato: {contrato.numeroContrato}
                        </Text>
                      </View>
                      <View style={styles.tableCellValue}>
                        <Text>{contrato.descripcion}</Text>
                      </View>
                    </View>
                    {/* Abonos individuales */}
                    {contrato.abonos.map((abono: any, aidx: number) => (
                      <View
                        key={abono._id}
                        style={{
                          flexDirection: "row",
                          backgroundColor: aidx % 2 === 0 ? "#fafdff" : "#f0f6fa",
                          borderTopWidth: aidx === 0 ? 1 : 0,
                          borderTopColor: "#bbdefb",
                        }}
                      >
                        <View style={styles.tableCellLabel}>
                          <Text style={{ fontSize: 9, color: "#333" }}>
                            Abono N° {abono.numeroAbono}
                          </Text>
                        </View>
                        <View style={styles.tableCellValue}>
                          <Text style={{ fontSize: 9, color: "#222", fontWeight: 500 }}>
                            {formatDecimal(abono.monto)} | {abono.tipoOperacion} | {abono.referencia} | {formatDate(abono.fecha)}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {/* Total por contrato */}
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Abonado Contrato:</Text>
                      <Text style={styles.totalValue}>
                        {formatDecimal(
                          contrato.abonos.reduce((sum: number, ab: any) => sum + (ab.monto ?? 0), 0)
                        )}
                      </Text>
                    </View>
                  </View>
                ))}
                {/* Total por cliente */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Abonado al Proveedor:</Text>
                  <Text style={styles.totalValue}>{formatDecimal(cliente.monto)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generado el {formatDate(new Date().toString())} | Página 1 de 1
        </Text>
      </Page>
    </Document>
  );
};

export default AbonosPorMesTemplate;