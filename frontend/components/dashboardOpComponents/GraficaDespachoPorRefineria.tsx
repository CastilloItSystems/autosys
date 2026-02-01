import React, { useEffect, useMemo, useState } from "react";
import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  getYear,
  subMonths,
} from "date-fns";
import { Despacho } from "@/libs/interfaces";

const colorPalette = [
  "#42A5F5",
  "#66BB6A",
  "#FFA726",
  "#EC407A",
  "#AB47BC",
  "#26A69A",
];

const getColor = (valor: number) => (valor >= 0 ? "#22C55E" : "#EF4444");

const calcularDiferencia = (actual: number, anterior: number) => {
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return ((actual - anterior) / anterior) * 100;
};

const procesarHistorico = (despachos: any[]) => {
  const datosHistoricos: Record<string, Record<string, any>> = {};
  despachos.forEach((despacho) => {
    const fecha = parseISO(despacho.fechaInicioDespacho);
    const mes = startOfMonth(fecha).toISOString();
    const refineria = despacho.idRefineria.nombre;
    if (!datosHistoricos[refineria]) datosHistoricos[refineria] = {};
    if (!datosHistoricos[refineria][mes]) {
      datosHistoricos[refineria][mes] = {
        enviado: 0,
        recibido: 0,
        despachos: 0,
      };
    }
    datosHistoricos[refineria][mes].enviado += despacho.cantidadEnviada || 0;
    datosHistoricos[refineria][mes].recibido += despacho.cantidadRecibida || 0;
    datosHistoricos[refineria][mes].despachos += 1;
  });
  return datosHistoricos;
};

const procesarDatosAnuales = (despachos: Despacho[]) => {
  const mesesDelAño = Array.from({ length: 12 }, (_, i) =>
    format(new Date(new Date().getFullYear(), i, 1), "MMM")
  );
  const refinerias = Array.from(
    new Set(despachos.map((r) => r.idRefineria.nombre))
  );
  const datos: Record<
    string,
    Record<string, { enviados: number; recibidos: number }>
  > = {};
  mesesDelAño.forEach((mes) => {
    datos[mes] = {};
    refinerias.forEach((refineria) => {
      datos[mes][refineria] = { enviados: 0, recibidos: 0 };
    });
  });
  despachos.forEach((despacho) => {
    const mes = format(parseISO(despacho.fechaInicioDespacho), "MMM");
    const refineria = despacho.idRefineria.nombre;
    if (datos[mes] && datos[mes][refineria]) {
      datos[mes][refineria].enviados += despacho.cantidadEnviada || 0;
      datos[mes][refineria].recibidos += despacho.cantidadRecibida || 0;
    }
  });
  const datasets = refinerias.flatMap((refineria, index) => [
    {
      label: `${refineria} - Enviados`,
      data: mesesDelAño.map((mes) => datos[mes][refineria].enviados),
      borderColor: colorPalette[index % colorPalette.length],
      tension: 0.4,
      borderWidth: 2,
      fill: false,
    },
    {
      label: `${refineria} - Recibidos`,
      data: mesesDelAño.map((mes) => datos[mes][refineria].recibidos),
      borderColor: colorPalette[index % colorPalette.length],
      borderDash: [5, 5],
      tension: 0.4,
      borderWidth: 2,
      fill: false,
    },
  ]);
  return {
    labels: mesesDelAño,
    datasets,
  };
};

const annualChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        boxWidth: 12,
        padding: 16,
      },
    },
    tooltip: {
      callbacks: {
        title: (context: any) => `Mes: ${context[0].label}`,
        label: (context: any) => {
          const labelParts = context.dataset.label.split(" - ");
          return `${labelParts[0]} (${
            labelParts[1]
          }): ${context.parsed.y.toLocaleString()} Barriles`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Barriles",
      },
    },
  },
};

const GraficaDespachoPorRefineria = ({
  despachos = [],
}: {
  despachos: any[];
}) => {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const historico = useMemo(() => procesarHistorico(despachos), [despachos]);

  const availableMonths = useMemo(() => {
    if (!despachos.length) return [];
    const fechas = despachos.map((r) => parseISO(r.fechaInicioDespacho));
    const min = fechas.reduce((a, b) => (a < b ? a : b));
    const max = fechas.reduce((a, b) => (a > b ? a : b));
    return eachMonthOfInterval({ start: min, end: max }).map((mes) => ({
      label: format(mes, "MMMM yyyy"),
      value: mes,
    }));
  }, [despachos]);

  useEffect(() => {
    if (availableMonths.length && !selectedMonth) {
      setSelectedMonth(availableMonths[availableMonths.length - 1].value);
    }
  }, [availableMonths, selectedMonth]);

  const refineriasData = useMemo(() => {
    if (!selectedMonth) return [];
    const mesActual = startOfMonth(selectedMonth).toISOString();
    const mesAnterior = startOfMonth(subMonths(selectedMonth, 1)).toISOString();
    return Object.keys(historico).map((refineria) => {
      const datosActual = historico[refineria][mesActual] || {
        enviado: 0,
        recibido: 0,
        despachos: 0,
      };
      const datosAnterior = historico[refineria][mesAnterior] || {
        enviado: 0,
        recibido: 0,
        despachos: 0,
      };
      return {
        nombre: refineria,
        ...datosActual,
        diferenciaPorcentaje: {
          enviado: calcularDiferencia(
            datosActual.enviado,
            datosAnterior.enviado
          ),
          recibido: calcularDiferencia(
            datosActual.recibido,
            datosAnterior.recibido
          ),
          despachos: calcularDiferencia(
            datosActual.despachos,
            datosAnterior.despachos
          ),
        },
      };
    });
  }, [selectedMonth, historico]);

  const annualChartData = useMemo(
    () => procesarDatosAnuales(despachos),
    [despachos]
  );

  return (
    <div className="fluid">
      {/* Gráfico Anual */}

      <Card
        title={`Comportamiento Anual de despacho de materia prima ${getYear(
          new Date()
        )}`}
        className="card p-0"
      >
        <div>
          <Chart
            type="line"
            data={annualChartData}
            options={annualChartOptions}
            style={{ minHeight: "200px" }}
          />
        </div>
        <div className="text-center mt-3">
          <small className="text-secondary">
            Línea continua: Enviados | Línea punteada: Recibidos
          </small>
        </div>
      </Card>
    </div>
  );
};

export default GraficaDespachoPorRefineria;
