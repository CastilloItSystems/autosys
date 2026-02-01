
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BalancesReportePDFProps {
  data: any[];
  refineryName?: string;
  logoUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
    position: "relative",
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
  headerTextBlock: {
    flexDirection: "column",
    justifyContent: "flex-start",
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
    borderRadius: 8,
    overflow: "hidden",
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

const columns = [
  { key: "numeroBalance", label: "N° Balance" },
  { key: "fechaInicio", label: "Fecha Inicio" },
  { key: "fechaFin", label: "Fecha Fin" },
  { key: "totalBarrilesCompra", label: "Total Barriles Compra (bbls)" },
  { key: "totalBarrilesVenta", label: "Total Barriles Venta (bbls)" },
  { key: "diferenciaBarriles", label: "Diferencia Barriles (%)" },
  { key: "totalCompras", label: "Total Compras" },
  { key: "totalVentas", label: "Total Ventas" },
  { key: "ganancia", label: "Ganancia" },
  { key: "perdida", label: "Pérdida" },
];

function formatDecimal(value: number | string | undefined) {
  if (value === undefined || value === null || value === "") return "0,00";
  return Number(value).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  } catch {
    return "N/A";
  }
}

function formatValue(key: string, row: any) {
  if (key === "fechaInicio" && row[key]) return formatDate(row[key]);
  if (key === "fechaFin" && row[key]) return formatDate(row[key]);
  if (key === "totalBarrilesCompra" && row[key] != null) return `${Number(row[key]).toLocaleString("es-ES")}`;
  if (key === "totalBarrilesVenta" && row[key] != null) return `${Number(row[key]).toLocaleString("es-ES")}`;
  if (key === "diferenciaBarriles") {
    if (row.totalBarrilesCompra != null && row.totalBarrilesVenta != null && row.totalBarrilesCompra > 0) {
      const diferencia = row.totalBarrilesVenta - row.totalBarrilesCompra;
      const porcentaje = (diferencia / row.totalBarrilesCompra) * 100;
      return `${porcentaje.toFixed(2)}%`;
    } else {
      return "-";
    }
  }
  if (["totalCompras", "totalVentas", "ganancia", "perdida"].includes(key) && row[key] != null)
    return `€ ${formatDecimal(row[key])}`;
  return row[key] ?? "-";
}

const BalancesReportePDF: React.FC<BalancesReportePDFProps> = ({ data = [], refineryName = "Refinería", logoUrl }) => {

  // Selecciona el logo de la refinería desde idRefineria.img si existe, si no usa el prop logoUrl, si no, usa el default
  let refineryLogo = logoUrl || "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRySSMU9Jhl6Uul6j_Y4raxmNj7y129zSrTBZgVoMDQSk1lsmVvL4GhALZ6p-fpFAMIRvKvgLO6g66LhjfLFEeHS29uIGSHBe0n2k-z5LM";
  if (Array.isArray(data) && data.length > 0 && data[0].idRefineria?.img && (data[0].idRefineria.img.startsWith("http") || data[0].idRefineria.img.startsWith("data:image"))) {
    refineryLogo = data[0].idRefineria.img;
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Encabezado con logo y datos */}
        <View style={styles.headerContainer}>
          <Image src={refineryLogo} style={styles.logo} />
          <View style={styles.headerTextBlock}>
            <Text style={styles.refineryName}>{refineryName}</Text>
            <Text style={styles.reportTitle}>Reporte de Balances</Text>
            <Text style={styles.reportDate}>Fecha: {format(new Date(), "dd/MM/yyyy", { locale: es })}</Text>
          </View>
        </View>

        {/* Tabla de balances */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            {columns.map((col, idx) => (
              <Text key={col.key} style={idx === columns.length - 1 ? [styles.tableCell, styles.tableCellLast] : styles.tableCell}>{col.label}</Text>
            ))}
          </View>
          {data.map((row, idx) => (
            <View
              key={idx}
              style={{
                ...styles.tableRow,
                backgroundColor: idx % 2 === 0 ? "#fafdff" : "#f0f6fa",
              }}
            >
              {columns.map((col, cidx) => (
                <Text key={col.key} style={cidx === columns.length - 1 ? [styles.tableCell, styles.tableCellLast] : styles.tableCell}>
                  {formatValue(col.key, row)}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generado el {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })} | Página 1 de 1
        </Text>
      </Page>
    </Document>
  );
};

export default BalancesReportePDF;
