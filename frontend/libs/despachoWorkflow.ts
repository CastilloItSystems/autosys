// // libs/recepcionWorkflow.ts
// export type EstadoDespacho =
//   | "PROGRAMADO"
//   | "EN_TRANSITO"
//   | "EN_REFINERIA"
//   | "DESCARGANDO"
//   | "COMPLETADO"
//   | "RECHAZADO"
//   | "CANCELADO";

// export type EstadoCarga =
//   | "PENDIENTE_MUESTREO"
//   | "MUESTREO_APROBADO"
//   | "EN_PROCESO"
//   | "PAUSADO"
//   | "FINALIZADO";

// Estados de Recepción (Flujo principal)
export const estadoDespachoOptions = [
  { label: "Programado", value: "PROGRAMADO" }, // Cuando está agendado
  { label: "Asignación Despacho", value: "EN_TRANSITO" }, // Reemplaza "En Recepción" para cuando viene en camino
  { label: "En Proceso", value: "EN_REFINERIA" }, // Cuando llega físicamente
  { label: "Despacho Completado", value: "COMPLETADO" }, // Finalización exitosa
  { label: "Cancelado", value: "CANCELADO" }, // Si no se presenta
];

// Estados de Carga/Descarga (Detalle operativo)
export const estadoCargaOptions = [
  { label: "Pendiente Muestreo", value: "PENDIENTE_MUESTREO" }, // Antes de iniciar
  { label: "Muestreo Aprobado", value: "MUESTREO_APROBADO" }, // Permite descarga
  { label: "En Proceso", value: "EN_PROCESO" }, // Descarga activa
  // { label: "Pausado", value: "PAUSADO" }, // Interrupciones
  { label: "Finalizado", value: "FINALIZADO" }, // Fin del proceso
  { label: "Rechazado", value: "RECHAZADO" }, // Si no cumple requisitos
];

// export const workflowConfig = {
//   estadosDespacho: {
//     opciones: [
//       { label: "Programado", value: "PROGRAMADO" },
//       { label: "En Tránsito", value: "EN_TRANSITO" },
//       { label: "En Refineria", value: "EN_REFINERIA" },
//       { label: "Descargando", value: "DESCARGANDO" },
//       { label: "Descarga Completa", value: "COMPLETADO" },
//       { label: "Rechazado", value: "RECHAZADO" },
//       { label: "Cancelado", value: "CANCELADO" },
//     ] as const,
//     transiciones: {
//       PROGRAMADO: ["EN_TRANSITO", "CANCELADO"],
//       EN_TRANSITO: ["PROGRAMADO", "EN_REFINERIA", "CANCELADO"],
//       EN_REFINERIA: ["EN_TRANSITO", "DESCARGANDO", "RECHAZADO", "CANCELADO"],
//       DESCARGANDO: ["EN_REFINERIA", "COMPLETADO", "RECHAZADO", "CANCELADO"],
//       COMPLETADO: ["DESCARGANDO", "CANCELADO"],
//       RECHAZADO: ["EN_REFINERIA"],
//       CANCELADO: ["PROGRAMADO", "EN_TRANSITO", "EN_REFINERIA"],
//     },
//     validaciones: {
//       EN_TRANSITO: ["idContrato", "idContratoItems", "cantidadEnviada"],
//       EN_REFINERIA: ["idGuia", "placa", "nombreChofer"],
//       DESCARGANDO: ["idTanque", "fechaLlegada"],
//       COMPLETADO: ["cantidadRecibida"],
//     },
//     reglasCampos: {
//       PROGRAMADO: ["idContrato", "idContratoItems", "cantidadEnviada"],
//       EN_TRANSITO: [
//         "idGuia",
//         "placa",
//         "nombreChofer",
//         "fechaSalida",
//         "fechaLlegada",
//       ],
//       EN_REFINERIA: ["fechaLlegada", "idTanque"],
//       DESCARGANDO: ["idTanque", "cantidadRecibida"],
//       COMPLETADO: [],
//       RECHAZADO: [],
//       CANCELADO: [],
//     },
//   },
//   estadosCarga: {
//     opciones: [
//       { label: "Pendiente Muestreo", value: "PENDIENTE_MUESTREO" },
//       { label: "Muestreo Aprobado", value: "MUESTREO_APROBADO" },
//       { label: "En Proceso", value: "EN_PROCESO" },
//       { label: "Pausado", value: "PAUSADO" },
//       { label: "Finalizado", value: "FINALIZADO" },
//     ] as const,
//     reglasCampos: {
//       PENDIENTE_MUESTREO: ["fechaInicioDespacho", "fechaFinDespacho"],
//       MUESTREO_APROBADO: ["fechaInicioDespacho", "fechaFinDespacho"],
//       EN_PROCESO: ["idLineaDespacho", "idTanque", "fechaFinDespacho"],
//       PAUSADO: [
//         "idLineaDespacho",
//         "idTanque",
//         "fechaInicioDespacho",
//         "fechaFinDespacho",
//       ],
//       FINALIZADO: [
//         "idLineaDespacho",
//         "idTanque",
//         "fechaInicioDespacho",
//         "fechaFinDespacho",
//       ],
//     },
//   },
// };

// Define los tipos para mayor seguridad y claridad
export type EstadoDespacho =
  | "PROGRAMADO"
  | "EN_TRANSITO"
  | "EN_REFINERIA"
  | "COMPLETADO"
  | "CANCELADO";

export type EstadoCarga =
  | "PENDIENTE_MUESTREO"
  | "MUESTREO_APROBADO"
  | "EN_PROCESO"
  | "PAUSADO"
  | "FINALIZADO"
  | "RECHAZADO";

// Reglas para habilitar/deshabilitar campos según el estado de recepción
export const fieldRulesDespacho: {
  [key in EstadoDespacho]?: { [field: string]: boolean };
} = {
  PROGRAMADO: {
    idContrato: true,
    idContratoItems: true,
    cantidadEnviada: true,
    idGuia: false,
    placa: false,
    nombreChofer: false,
    fechaSalida: false,
    fechaLlegada: false,
    idTanque: false,
    cantidadRecibida: false,
  },
  EN_TRANSITO: {
    idContrato: false,
    idContratoItems: false,
    cantidadEnviada: false,
    idGuia: true,
    placa: true,
    nombreChofer: true,
    fechaSalida: true,
    fechaLlegada: true,
    idTanque: false,
    cantidadRecibida: false,
  },
  EN_REFINERIA: {
    idContrato: false,
    idContratoItems: false,
    cantidadEnviada: false,
    idGuia: false,
    placa: false,
    nombreChofer: false,
    fechaSalida: false,
    fechaLlegada: true,
    idTanque: true,
  },

  COMPLETADO: {
    idContrato: false,
    idContratoItems: false,
    cantidadEnviada: false,
    idGuia: false,
    placa: false,
    nombreChofer: false,
    fechaSalida: false,
    fechaLlegada: false,
    idTanque: false,
    fechaFinDespacho: true,
    cantidadRecibida: true,
  },
};

// Reglas para habilitar/deshabilitar campos según el estado de carga
export const fieldRulesCarga: {
  [key in EstadoCarga]?: { [field: string]: boolean };
} = {
  PENDIENTE_MUESTREO: {
    estadoCarga: true,
    idLineaDespacho: false,
    idTanque: false,
    fechaInicioDespacho: true,
    fechaFinDespacho: true,
    cantidadRecibida: true,
  },
  MUESTREO_APROBADO: {
    estadoCarga: true,
    cantidadRecibida: true,
    idLineaDespacho: false,
    idTanque: false,
    fechaInicioDespacho: true,
    fechaFinDespacho: true,
  },
  EN_PROCESO: {
    estadoCarga: true,
    cantidadRecibida: true,
    idLineaDespacho: true,
    idTanque: true,
    fechaInicioDespacho: false,
    fechaFinDespacho: true,
  },
  PAUSADO: {
    estadoCarga: false,
    cantidadRecibida: true,
    idLineaDespacho: true,
    idTanque: true,
    fechaInicioDespacho: true,
    fechaFinDespacho: true,
  },
  FINALIZADO: {
    estadoCarga: true,
    cantidadRecibida: false,
    idLineaDespacho: true,
    idTanque: true,
    fechaInicioDespacho: true,
    fechaFinDespacho: false,
  },
};

// Definir transiciones de estado válidas
export const estadoTransicionesDespacho: {
  [key in EstadoDespacho]?: EstadoDespacho[];
} = {
  PROGRAMADO: ["EN_TRANSITO", "CANCELADO", "PROGRAMADO"],
  EN_TRANSITO: ["PROGRAMADO", "EN_REFINERIA", "CANCELADO", "EN_TRANSITO"],
  EN_REFINERIA: ["EN_TRANSITO", "COMPLETADO", "CANCELADO", "EN_REFINERIA"],

  COMPLETADO: ["EN_REFINERIA", "CANCELADO", "COMPLETADO"],
  CANCELADO: ["PROGRAMADO", "EN_TRANSITO", "EN_REFINERIA", "CANCELADO"],
  // RECHAZADO: ["EN_REFINERIA", "RECHAZADO"],
};

// Definir campos requeridos para cada estado
export const estadoValidacionesDespacho: {
  [key in EstadoDespacho]?: string[];
} = {
  EN_TRANSITO: ["idContrato", "idContratoItems", "cantidadEnviada"],
  EN_REFINERIA: [
    "idGuia",
    "placa",
    "nombreChofer",
    "fechaSalida",
    "fechaLlegada",
  ],
  COMPLETADO: ["cantidadRecibida", "fechaFinDespacho"],
};

export const estadoTransicionesCarga: {
  [key in EstadoCarga]?: EstadoCarga[];
} = {
  PENDIENTE_MUESTREO: ["MUESTREO_APROBADO", "PENDIENTE_MUESTREO", "RECHAZADO"],
  MUESTREO_APROBADO: [
    "PENDIENTE_MUESTREO",
    "EN_PROCESO",
    "MUESTREO_APROBADO",
    "RECHAZADO",
  ],
  EN_PROCESO: ["MUESTREO_APROBADO", "FINALIZADO", "EN_PROCESO", "RECHAZADO"],
  // PAUSADO: ["EN_PROCESO", "FINALIZADO", "PAUSADO"],
  FINALIZADO: ["EN_PROCESO", "FINALIZADO"],
  RECHAZADO: [
    "PENDIENTE_MUESTREO",
    "MUESTREO_APROBADO",
    "EN_PROCESO",
    "RECHAZADO",
  ],
};

export const estadoValidacionesCarga: {
  [key in EstadoCarga]?: string[];
} = {
  // PENDIENTE_MUESTREO: ["fechaInicioDespacho", "fechaFinDespacho"],
  // MUESTREO_APROBADO: ["fechaInicioDespacho", "fechaFinDespacho"],
  EN_PROCESO: ["idLineaDespacho", "idTanque"],
  PAUSADO: ["idLineaDespacho", "idTanque", "fechaInicioDespacho"],
  FINALIZADO: ["idLineaDespacho", "idTanque", "fechaInicioDespacho"],
};

// Opciones para los dropdowns de estado
// export const estadoDespachoOptions = Object.keys(estadoTransicionesDespacho).map(
//   (estado) =>
//     ({
//       label: estado,
//       value: estado,
//     } as { label: string; value: EstadoDespacho })
// );

// export const estadoCargaOptions = Object.keys(fieldRulesCarga).map(
//   (estado) =>
//     ({
//       label: estado,
//       value: estado,
//     } as { label: string; value: EstadoCarga })
// );

export const getValidTransitionsDespacho = (
  currentState: EstadoDespacho
): EstadoDespacho[] => {
  return estadoTransicionesDespacho[currentState] || [];
};

export const getValidTransitionsCarga = (
  currentState: EstadoCarga
): EstadoCarga[] => {
  return estadoTransicionesCarga[currentState] || [];
};
