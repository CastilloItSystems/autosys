import { array, boolean, date, number, object, string, union, z } from "zod";

export const despachoBKSchema = object({
  estadoCarga: string().min(1, "El estado de carga es obligatorio").optional(),
  estadoDespacho: string()
    .min(1, "El estado de recepción es obligatorio")
    .optional(),
  eliminado: boolean().default(false),
  cantidadEnviada: number()
    .min(0, "La cantidad enviada debe ser un número no negativo")
    .optional(),
  cantidadRecibida: number()
    .min(0, "La cantidad recibida debe ser un número no negativo")
    .optional(),
  fechaInicio: union([string(), date()]).optional(),
  fechaFin: union([string(), date()]).optional(),
  fechaInicioDespacho: union([string(), date()]).optional(),
  fechaFinDespacho: union([string(), date()]).optional(),
  fechaSalida: union([string(), date()]).optional(),
  fechaLlegada: union([string(), date()]).optional(),
  idContrato: object({
    numeroContrato: string().min(1, "El estado es obligatorio").optional(),
    id: string().optional(),
    idRefineria: object({
      id: string().optional(),
      nombre: string().min(1, "El nombre de la refinería es obligatorio"),
    }).optional(),
    idContacto: object({
      id: string().optional(),
      nombre: string().min(1, "El nombre del contacto es obligatorio"),
    }).optional(),
    idItems: array(
      object({
        estado: string().min(1, "El estado es obligatorio"),
        eliminado: boolean().default(false),
        id: string().optional(),
        producto: object({
          nombre: string().min(1, "El nombre del producto es obligatorio"),
          id: string().min(1, "El ID del producto es obligatorio"),
          color: string().min(1, "El color es obligatorio").optional(),
        }),
        cantidad: number().min(0, "La cantidad debe ser un número no negativo"),
        precioUnitario: number().min(
          0,
          "El precio unitario debe ser un número no negativo"
        ),
        gravedadAPI: number().min(
          0,
          "La gravedad API debe ser un número no negativo"
        ),
        azufre: number().min(0, "El azufre debe ser un número no negativo"),

        contenidoAgua: number().min(
          0,
          "El contenido de agua debe ser un número no negativo"
        ),

        clasificacion: string().min(1, "El origen es obligatorio"),

        puntoDeInflamacion: number().min(
          0,
          "La presión debe ser un número no negativo"
        ),
      })
    ).optional(),
  }).optional(),
  idContratoItems: object({
    estado: string().min(1, "El estado es obligatorio"),
    eliminado: boolean().default(false),
    id: string().optional(),
    producto: object({
      nombre: string().min(1, "El nombre del producto es obligatorio"),
      id: string().min(1, "El ID del producto es obligatorio"),
    }),
    cantidad: number().min(0, "La cantidad debe ser un número no negativo"),
    precioUnitario: number().min(
      0,
      "El precio unitario debe ser un número no negativo"
    ),
    gravedadAPI: number().min(
      0,
      "La gravedad API debe ser un número no negativo"
    ),
    azufre: number().min(0, "El azufre debe ser un número no negativo"),

    contenidoAgua: number().min(
      0,
      "El contenido de agua debe ser un número no negativo"
    ),
    clasificacion: string().min(1, "El origen es obligatorio"),
    puntoDeInflamacion: number().min(
      0,
      "La temperatura debe ser un número no negativo"
    ),
  }).optional(),
  idLineaDespacho: object({
    id: string().optional(),
    nombre: string().min(1, "El nombre de la línea es obligatorio"),
  })
    .optional()
    .nullable(),
  idTanque: object({
    id: string().optional(),
    nombre: string().min(1, "El nombre del tanque es obligatorio"),
  })
    .optional()
    .nullable(),
  idGuia: number()
    .min(0, "El ID de la guía debe ser un número no negativo")
    .optional(),
  idRefineria: object({
    id: string().optional(),
    nombre: string().min(1, "El nombre de la refinería es obligatorio"),
  }).optional(),
  placa: string()
    // .min(1, "La placa es obligatoria")
    .optional(),
  nombreChofer: string()
    // .min(1, "El nombre del chofer es obligatorio")
    .optional(),

  createdAt: union([string(), date()]).optional(),
  updatedAt: union([string(), date()]).optional(),
  id: string().optional(),
}).superRefine((data, ctx) => {
  // Validaciones basadas en el estado de recepción
  if (data.estadoDespacho === "PROGRAMADO") {
    if (!data.idContrato) {
      ctx.addIssue({
        path: ["idContrato"],
        code: "custom",
        message: "Debe seleccionar un contrato si el estado es PROGRAMADO",
      });
    }
    if (!data.idContratoItems) {
      ctx.addIssue({
        path: ["idContratoItems"],
        code: "custom",
        message: "Debe seleccionar un contrato si el estado es PROGRAMADO",
      });
    }
    if (!data.cantidadEnviada) {
      ctx.addIssue({
        path: ["cantidadEnviada"],
        code: "custom",
        message:
          "La cantidad enviada es obligatoria si el estado es PROGRAMADO",
      });
    }
    // if (!data.idLinea) {
    //   ctx.addIssue({
    //     path: ["idLinea"],
    //     code: "custom",
    //     message: "Debe seleccionar una línea si el estado es PROGRAMADO",
    //   });
    // }
    // if (!data.idTanque) {
    //   ctx.addIssue({
    //     path: ["idTanque"],
    //     code: "custom",
    //     message: "Debe seleccionar un tanque si el estado es PROGRAMADO",
    //   });
    // }
    // if (!data.idGuia) {
    //   ctx.addIssue({
    //     path: ["idGuia"],
    //     code: "custom",
    //     message: "Debe seleccionar una guía si el estado es PROGRAMADO",
    //   });
    // }
    // if (!data.idRefineria) {
    //   ctx.addIssue({
    //     path: ["idRefineria"],
    //     code: "custom",
    //     message: "Debe seleccionar una refinería si el estado es PROGRAMADO",
    //   });
    // }
    // if (!data.placa) {
    //   ctx.addIssue({
    //     path: ["placa"],
    //     code: "custom",
    //     message: "Debe ingresar una placa si el estado es PROGRAMADO",
    //   });
    // }
    // if (!data.nombreChofer) {
    //   ctx.addIssue({
    //     path: ["nombreChofer"],
    //     code: "custom",
    //     message: "Debe ingresar un nombre de chofer si el estado es PROGRAMADO",
    //   });
    // }
    // if (!data.apellidoChofer) {
    //   ctx.addIssue({
    //     path: ["apellidoChofer"],
    //     code: "custom",
    //     message:
    //       "Debe ingresar un apellido de chofer si el estado es PROGRAMADO",
    //   });
    // }
    // if (!data.fechaInicio) {
    //   ctx.addIssue({
    //     path: ["fechaInicio"],
    //     code: "custom",
    //     message: "Debe ingresar una fecha de inicio si el estado es PROGRAMADO",
    //   });
    // }
    // if (!data.fechaFin) {
    //   ctx.addIssue({
    //     path: ["fechaFin"],
    //     code: "custom",
    //     message: "Debe ingresar una fecha de fin si el estado es PROGRAMADO",
    //   });
    // }
  }
  if (data.estadoDespacho === "EN_TRANSITO") {
    if (!data.idContrato) {
      ctx.addIssue({
        path: ["idContrato"],
        code: "custom",
        message: "Debe seleccionar un contrato si el estado es en transito",
      });
    }
    if (!data.idContratoItems) {
      ctx.addIssue({
        path: ["idContratoItems"],
        code: "custom",
        message: "Debe seleccionar un contrato si el estado es en transito",
      });
    }
    if (!data.cantidadEnviada) {
      ctx.addIssue({
        path: ["cantidadEnviada"],
        code: "custom",
        message:
          "La cantidad enviada es obligatoria si el estado es en transito",
      });
    }
    if (!data.idGuia) {
      ctx.addIssue({
        path: ["idGuia"],
        code: "custom",
        message: "Debe seleccionar una guía si el estado es en transito",
      });
    }
    if (!data.placa) {
      ctx.addIssue({
        path: ["placa"],
        code: "custom",
        message: "Debe ingresar una placa si el estado es en transito",
      });
    }
    if (!data.nombreChofer) {
      ctx.addIssue({
        path: ["nombreChofer"],
        code: "custom",
        message:
          "Debe ingresar un nombre de chofer si el estado es en transito",
      });
    }
    if (!data.fechaSalida) {
      ctx.addIssue({
        path: ["fechaSalida"],
        code: "custom",
        message:
          "Debe ingresar una fecha de salida si el estado es en transito",
      });
    }
    if (!data.fechaLlegada) {
      ctx.addIssue({
        path: ["fechaLlegada"],
        code: "custom",
        message:
          "Debe ingresar una fecha de llegada si el estado es en transito",
      });
    }
  }

  if (data.estadoDespacho === "EN_REFINERIA" && !data.fechaLlegada) {
    ctx.addIssue({
      path: ["fechaLlegada"],
      code: "custom",
      message: "La fecha de llegada es obligatoria cuando está en refinería",
    });
  }

  // Validaciones basadas en el estado de carga
  if (data.estadoCarga === "EN_PROCESO" && !data.idTanque) {
    ctx.addIssue({
      path: ["idTanque"],
      code: "custom",
      message: "Debe seleccionar un tanque si el estado de carga es EN_PROCESO",
    });
  }
  if (data.estadoCarga === "EN_PROCESO") {
    if (!data.fechaInicioDespacho) {
      ctx.addIssue({
        path: ["fechaInicioDespacho"],
        code: "custom",
        message:
          "Debe colocar una fecha de inicio de recepción si el estado de carga es EN_PROCESO",
      });
    }
  }
  if (data.estadoCarga === "FINALIZADO") {
    if (!data.fechaFinDespacho) {
      ctx.addIssue({
        path: ["fechaFinDespacho"],
        code: "custom",
        message:
          "Debe colocar una fecha de fin de recepción si el estado de carga es FINALIZADO",
      });
    }
    if (!data.cantidadRecibida) {
      ctx.addIssue({
        path: ["cantidadRecibida"],
        code: "custom",
        message:
          "Debe colocar una cantidad recibida si el estado de carga es FINALIZADO",
      });
    }
  }
});
