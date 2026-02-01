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

const procesarHistorico = (recepcions: any[]) => {
  const datosHistoricos: Record<string, Record<string, any>> = {};
  recepcions.forEach((recepcion) => {
    const fecha = parseISO(recepcion.fechaInicioRecepcion);
    const mes = startOfMonth(fecha).toISOString();
    const refineria = recepcion.idRefineria.nombre;
    if (!datosHistoricos[refineria]) datosHistoricos[refineria] = {};
    if (!datosHistoricos[refineria][mes]) {
      datosHistoricos[refineria][mes] = {
        enviado: 0,
        recibido: 0,
        recepciones: 0,
      };
    }
    datosHistoricos[refineria][mes].enviado += recepcion.cantidadEnviada;
    datosHistoricos[refineria][mes].recibido += recepcion.cantidadRecibida;
    datosHistoricos[refineria][mes].recepciones += 1;
  });
  return datosHistoricos;
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

const CardRecepcionesPorRefineria = ({
  recepcions = [],
}: {
  recepcions: Recepcion[];
}) => {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  // Memoized historico
  const historico = useMemo(() => procesarHistorico(recepcions), [recepcions]);

  // Meses disponibles
  const availableMonths = useMemo(() => {
    if (!recepcions.length) return [];
    const fechas = recepcions.map((r) => parseISO(r.fechaInicioRecepcion));
    const min = fechas.reduce((a, b) => (a < b ? a : b));
    const max = fechas.reduce((a, b) => (a > b ? a : b));
    return eachMonthOfInterval({ start: min, end: max }).map((mes) => ({
      label: format(mes, "MMMM yyyy"),
      value: mes,
    }));
  }, [recepcions]);

  // Selección automática del mes más reciente
  useEffect(() => {
    if (availableMonths.length && !selectedMonth) {
      setSelectedMonth(availableMonths[availableMonths.length - 1].value);
    }
  }, [availableMonths, selectedMonth]);

  // Datos del mes seleccionado
  const monthTotals = useMemo(() => {
    if (!selectedMonth) return { enviados: 0, recibidos: 0, recepciones: 0 };
    const mesInicio = startOfMonth(selectedMonth);
    const mesFin = endOfMonth(selectedMonth);
    const datosFiltrados = recepcions.filter((r) => {
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
  }, [selectedMonth, recepcions]);

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

  // Datos anuales para el gráfico
  const annualChartData = useMemo(
    () => procesarDatosAnuales(recepcions),
    [recepcions]
  );

  return (
    <div className="fluid">
      <div className="grid ">
        {/* Selector de Mes */}
        <div className="col-12 md:col-3 lg:col-2">
          <Card title="Selección de Mes" className="mb-4">
            <Dropdown
              value={selectedMonth}
              options={availableMonths}
              onChange={(e) => setSelectedMonth(e.value)}
              optionLabel="label"
              placeholder="Seleccione un mes"
              style={{ width: "100%" }}
            />
          </Card>
        </div>
        {/* Tarjetas de Refinerías */}
        <div className="col-12 md:col-9 lg:col-10">
          <div className="grid">
            {refineriasData.map((refineria, index) => (
              <div className="col-12 md:col-6 lg:col-4" key={index}>
                <div className="p-2">
                  <div
                    className="card p-3"
                    style={{
                      borderLeft: `4px solid ${
                        index % 2 ? "#42A5F5" : "#66BB6A"
                      }`,
                      borderRadius: "8px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <div className="flex justify-content-between align-items-center mb-3">
                      <h5 style={{ margin: 0 }}>{refineria.nombre}</h5>
                    </div>
                    <div className="grid">
                      <div className="col-12">
                        <div className="flex justify-content-between mb-2">
                          <span>Enviado:</span>
                          <div>
                            <strong>
                              {refineria.enviado.toLocaleString()}
                            </strong>
                            <span
                              style={{
                                color: getColor(
                                  refineria.diferenciaPorcentaje.enviado
                                ),
                                marginLeft: "0.5rem",
                                fontSize: "0.9em",
                              }}
                            >
                              (
                              {refineria.diferenciaPorcentaje.enviado.toFixed(
                                1
                              )}
                              %)
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-content-between mb-2">
                          <span>Recibido:</span>
                          <div>
                            <strong>
                              {refineria.recibido.toLocaleString()}
                            </strong>
                            <span
                              style={{
                                color: getColor(
                                  refineria.diferenciaPorcentaje.recibido
                                ),
                                marginLeft: "0.5rem",
                                fontSize: "0.9em",
                              }}
                            >
                              (
                              {refineria.diferenciaPorcentaje.recibido.toFixed(
                                1
                              )}
                              %)
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-content-between">
                          <span>Recepciones:</span>
                          <div>
                            <strong>{refineria.recepciones}</strong>
                            <span
                              style={{
                                color: getColor(
                                  refineria.diferenciaPorcentaje.recepciones
                                ),
                                marginLeft: "0.5rem",
                                fontSize: "0.9em",
                              }}
                            >
                              (
                              {refineria.diferenciaPorcentaje.recepciones.toFixed(
                                1
                              )}
                              %)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardRecepcionesPorRefineria;
