// // libs/recepcionWorkflow.ts
// export type EstadoRecepcion =
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
export const estadoRecepcionOptions = [
  { label: "Programado", value: "PROGRAMADO" }, // Cuando está agendado
  { label: "En Tránsito", value: "EN_TRANSITO" }, // Reemplaza "En Recepción" para cuando viene en camino
  { label: "En Refineria", value: "EN_REFINERIA" }, // Cuando llega físicamente
  { label: "Recepción Completada", value: "COMPLETADO" }, // Finalización exitosa
  { label: "Cancelado", value: "CANCELADO" }, // Si no se presenta
];

// Estados de Carga/Descarga (Detalle operativo)
export const estadoCargaOptions = [
  { label: "Muestreo Pendiente", value: "PENDIENTE_MUESTREO" }, // Antes de iniciar
  { label: "Muestreo Aprobado", value: "MUESTREO_APROBADO" }, // Permite descarga
  { label: "En Proceso", value: "EN_PROCESO" }, // Descarga activa
  // { label: "Pausado", value: "PAUSADO" }, // Interrupciones
  { label: "Finalizado", value: "FINALIZADO" }, // Fin del proceso
  { label: "Muestreo Rechazado", value: "RECHAZADO" }, // Si no cumple requisitos
];

// export const workflowConfig = {
//   estadosRecepcion: {
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
//       PENDIENTE_MUESTREO: ["fechaInicioRecepcion", "fechaFinRecepcion"],
//       MUESTREO_APROBADO: ["fechaInicioRecepcion", "fechaFinRecepcion"],
//       EN_PROCESO: ["idLinea", "idTanque", "fechaFinRecepcion"],
//       PAUSADO: [
//         "idLinea",
//         "idTanque",
//         "fechaInicioRecepcion",
//         "fechaFinRecepcion",
//       ],
//       FINALIZADO: [
//         "idLinea",
//         "idTanque",
//         "fechaInicioRecepcion",
//         "fechaFinRecepcion",
//       ],
//     },
//   },
// };

// Define los tipos para mayor seguridad y claridad
export type EstadoRecepcion =
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
export const fieldRulesRecepcion: {
  [key in EstadoRecepcion]?: { [field: string]: boolean };
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
    fechaFinRecepcion: true,
    cantidadRecibida: true,
  },
};

// Reglas para habilitar/deshabilitar campos según el estado de carga
export const fieldRulesCarga: {
  [key in EstadoCarga]?: { [field: string]: boolean };
} = {
  PENDIENTE_MUESTREO: {
    estadoCarga: true,
    idLinea: false,
    idTanque: false,
    fechaInicioRecepcion: true,
    fechaFinRecepcion: true,
    cantidadRecibida: true,
  },
  MUESTREO_APROBADO: {
    estadoCarga: true,
    cantidadRecibida: true,
    idLinea: false,
    idTanque: false,
    fechaInicioRecepcion: true,
    fechaFinRecepcion: true,
  },
  EN_PROCESO: {
    estadoCarga: true,
    cantidadRecibida: true,
    idLinea: true,
    idTanque: true,
    fechaInicioRecepcion: false,
    fechaFinRecepcion: true,
  },
  PAUSADO: {
    estadoCarga: false,
    cantidadRecibida: true,
    idLinea: true,
    idTanque: true,
    fechaInicioRecepcion: true,
    fechaFinRecepcion: true,
  },
  FINALIZADO: {
    estadoCarga: true,
    cantidadRecibida: false,
    idLinea: true,
    idTanque: true,
    fechaInicioRecepcion: true,
    fechaFinRecepcion: false,
  },
};

// Definir transiciones de estado válidas
export const estadoTransicionesRecepcion: {
  [key in EstadoRecepcion]?: EstadoRecepcion[];
} = {
  PROGRAMADO: ["EN_TRANSITO", "CANCELADO", "PROGRAMADO"],
  EN_TRANSITO: ["PROGRAMADO", "EN_REFINERIA", "CANCELADO", "EN_TRANSITO"],
  EN_REFINERIA: ["EN_TRANSITO", "COMPLETADO", "CANCELADO", "EN_REFINERIA"],

  COMPLETADO: ["EN_REFINERIA", "CANCELADO", "COMPLETADO"],
  CANCELADO: ["PROGRAMADO", "EN_TRANSITO", "EN_REFINERIA", "CANCELADO"],
  // RECHAZADO: ["EN_REFINERIA", "RECHAZADO"],
};

// Definir campos requeridos para cada estado
export const estadoValidacionesRecepcion: {
  [key in EstadoRecepcion]?: string[];
} = {
  EN_TRANSITO: ["idContrato", "idContratoItems", "cantidadEnviada"],
  EN_REFINERIA: [
    "idGuia",
    "placa",
    "nombreChofer",
    "fechaSalida",
    "fechaLlegada",
  ],
  COMPLETADO: ["cantidadRecibida", "fechaFinRecepcion"],
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
  // PENDIENTE_MUESTREO: ["fechaInicioRecepcion", "fechaFinRecepcion"],
  // MUESTREO_APROBADO: ["fechaInicioRecepcion", "fechaFinRecepcion"],
  EN_PROCESO: ["idLinea", "idTanque"],
  PAUSADO: ["idLinea", "idTanque", "fechaInicioRecepcion"],
  FINALIZADO: ["idLinea", "idTanque", "fechaInicioRecepcion"],
};

// Opciones para los dropdowns de estado
// export const estadoRecepcionOptions = Object.keys(estadoTransicionesRecepcion).map(
//   (estado) =>
//     ({
//       label: estado,
//       value: estado,
//     } as { label: string; value: EstadoRecepcion })
// );

// export const estadoCargaOptions = Object.keys(fieldRulesCarga).map(
//   (estado) =>
//     ({
//       label: estado,
//       value: estado,
//     } as { label: string; value: EstadoCarga })
// );

export const getValidTransitionsRecepcion = (
  currentState: EstadoRecepcion
): EstadoRecepcion[] => {
  return estadoTransicionesRecepcion[currentState] || [];
};

export const getValidTransitionsCarga = (
  currentState: EstadoCarga
): EstadoCarga[] => {
  return estadoTransicionesCarga[currentState] || [];
};
