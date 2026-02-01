import React, { useEffect, useMemo, useState, useRef } from "react";
import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
// import FiltrosDashboard from "./FiltrosDashboard";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  getYear,
  subMonths,
} from "date-fns";
import { Recepcion } from "@/libs/interfaces";

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

const procesarDatosAnuales = (recepcions: any[]) => {
  const mesesDelAño = Array.from({ length: 12 }, (_, i) =>
    format(new Date(new Date().getFullYear(), i, 1), "MMM")
  );
  const refinerias = Array.from(
    new Set(recepcions.map((r) => r.idRefineria.nombre))
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
  recepcions.forEach((recepcion) => {
    const mes = format(parseISO(recepcion.fechaInicioRecepcion), "MMM");
    const refineria = recepcion.idRefineria.nombre;
    if (datos[mes] && datos[mes][refineria]) {
      datos[mes][refineria].enviados += recepcion.cantidadEnviada;
      datos[mes][refineria].recibidos += recepcion.cantidadRecibida;
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
interface GraficaRecepcionesPorRefineriaProps {
  recepcions: Recepcion[];
  selectedYear: number;
  selectedRefinerias: string[];
  selectedMonth: Date | null;
  availableYears: number[];
  availableRefinerias: string[];
  availableMonths: { label: string; value: Date }[];
}

const GraficaRecepcionesPorRefineria = ({
  recepcions = [],
  selectedYear,
  selectedRefinerias,
  selectedMonth,
  availableYears,
  availableRefinerias,
  availableMonths,
}: GraficaRecepcionesPorRefineriaProps) => {
  const [processing, setProcessing] = useState(false);
  // Procesamiento con Web Worker
  const workerRef = useRef<Worker | null>(null);
  const [filteredRecepcions, setFilteredRecepcions] = useState<any[]>([]);
  const [historico, setHistorico] = useState<
    Record<string, Record<string, any>>
  >({});

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../../workers/recepcionesWorker.ts", import.meta.url)
      );
    }
    const worker = workerRef.current;
    setProcessing(true);
    worker.onmessage = (e) => {
      setFilteredRecepcions(e.data.filtered);
      setHistorico(e.data.datosHistoricos);
      setProcessing(false);
    };
    worker.postMessage({ recepcions, selectedYear, selectedRefinerias });
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recepcions, selectedYear, selectedRefinerias]);

  // Datos del mes seleccionado
  const monthTotals = useMemo(() => {
    if (!selectedMonth) return { enviados: 0, recibidos: 0, recepciones: 0 };
    const mesInicio = startOfMonth(selectedMonth);
    const mesFin = endOfMonth(selectedMonth);
    const datosFiltrados = filteredRecepcions.filter((r) => {
      const fecha = parseISO(r.fechaInicioRecepcion);
      return fecha >= mesInicio && fecha <= mesFin;
    });
    return datosFiltrados.reduce(
      (acc, recepcion) => ({
        enviados: acc.enviados + recepcion.cantidadEnviada,
        recibidos: acc.recibidos + recepcion.cantidadRecibida,
        recepciones: acc.recepciones + 1,
      }),
      { enviados: 0, recibidos: 0, recepciones: 0 }
    );
  }, [selectedMonth, filteredRecepcions]);

  // Datos por refinería para el mes seleccionado
  const refineriasData = useMemo(() => {
    if (!selectedMonth) return [];
    const mesActual = startOfMonth(selectedMonth).toISOString();
    const mesAnterior = startOfMonth(subMonths(selectedMonth, 1)).toISOString();
    return Object.keys(historico).map((refineria) => {
      const datosActual = historico[refineria][mesActual] || {
        enviado: 0,
        recibido: 0,
        recepciones: 0,
      };
      const datosAnterior = historico[refineria][mesAnterior] || {
        enviado: 0,
        recibido: 0,
        recepciones: 0,
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
          recepciones: calcularDiferencia(
            datosActual.recepciones,
            datosAnterior.recepciones
          ),
        },
      };
    });
  }, [selectedMonth, historico]);

  // Datos anuales para el gráfico (solo del año/refinería seleccionados)
  const annualChartData = useMemo(
    () => procesarDatosAnuales(filteredRecepcions),
    [filteredRecepcions]
  );

  // UX: feedback de carga con skeleton loader
  if (processing) {
    return (
      <div className="fluid">
        <div className="card p-0 mb-4" style={{ minHeight: 260 }}>
          <div className="p-skeleton w-full h-8rem border-round mb-2" />
          <div className="p-skeleton w-6rem h-1rem border-round mx-auto mb-2" />
        </div>
        <div className="card p-0 mt-4">
          <div className="flex flex-wrap gap-4 mb-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex flex-column align-items-center border-1 border-round p-3"
                style={{ minWidth: 180 }}
              >
                <div className="p-skeleton w-6rem h-1.5rem border-round mb-1" />
                <div className="p-skeleton w-7rem h-1rem border-round mb-1" />
                <div className="p-skeleton w-7rem h-1rem border-round mb-1" />
                <div className="p-skeleton w-5rem h-1rem border-round mb-1" />
                <div className="p-skeleton w-8rem h-0.75rem border-round mt-2" />
              </div>
            ))}
          </div>
          <div className="mt-2">
            <div className="p-skeleton w-32rem h-1rem border-round mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fluid">
      <Card
        title={`Comportamiento Anual de recepción de materia prima ${selectedYear}`}
        className="card p-0"
      >
        <div style={{ minHeight: "200px" }}>
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
      {/* Resumen mensual */}
      <div className="mt-4">
        <Card
          title={
            selectedMonth
              ? `Resumen de ${format(selectedMonth, "MMMM yyyy")}`
              : "Resumen mensual"
          }
          className="card p-0"
        >
          {selectedMonth ? (
            <>
              <div className="flex flex-wrap gap-4 mb-2">
                {refineriasData.map((r) => (
                  <div
                    key={r.nombre}
                    className="flex flex-column align-items-center border-1 border-round p-3"
                    style={{ minWidth: 180 }}
                  >
                    <span className="font-bold text-lg mb-1">{r.nombre}</span>
                    <span className="text-green-600 font-bold">
                      Enviado: {r.enviado.toLocaleString()} bbl
                    </span>
                    <span className="text-blue-600 font-bold">
                      Recibido: {r.recibido.toLocaleString()} bbl
                    </span>
                    <span className="text-600">
                      Recepciones: {r.recepciones}
                    </span>
                    <span className="text-xs mt-2">
                      Δ Enviado:{" "}
                      <span
                        style={{
                          color: getColor(r.diferenciaPorcentaje.enviado),
                        }}
                      >
                        {r.diferenciaPorcentaje.enviado.toFixed(1)}%
                      </span>{" "}
                      | Δ Recibido:{" "}
                      <span
                        style={{
                          color: getColor(r.diferenciaPorcentaje.recibido),
                        }}
                      >
                        {r.diferenciaPorcentaje.recibido.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <b>Total Enviado:</b> {monthTotals.enviados.toLocaleString()}{" "}
                bbl | <b>Total Recibido:</b>{" "}
                {monthTotals.recibidos.toLocaleString()} bbl |{" "}
                <b>Recepciones:</b> {monthTotals.recepciones}
              </div>
            </>
          ) : (
            <span className="text-500">
              Selecciona un mes para ver el resumen.
            </span>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GraficaRecepcionesPorRefineria;
