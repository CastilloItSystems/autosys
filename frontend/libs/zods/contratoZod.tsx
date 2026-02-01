import { array, boolean, date, number, object, string, union, z } from "zod";

export const contactoSchema = object({
  id: string().optional(),
  nombre: string().min(1, "La razon es obligatoria"),
  identificacionFiscal: string()
    // .regex(/^[0-9-]+$/, {
    //   message: "El NIT solo puede contener números y el carácter '-'",
    // })
    .min(8, { message: "El NIT debe tener al menos 8 caracteres" }) // Valida longitud mínima
    .max(13, { message: "El NIT no puede tener más de 13 caracteres" }), // Valida longitud máxima
  correo: string().email("El correo debe ser válido"),
  direccion: string().min(1, "La dirección es obligatoria"),
  telefono: string()
    .nonempty("El teléfono es obligatorio")
    .min(8, "El teléfono debe tener al menos 8 dígitos")
    .max(15, "El teléfono no puede exceder los 15 dígitos")
    .regex(/^\+[1-9]\d+$/, {
      message:
        "Formato inválido. Use: +[código país][número]. Ej: +584248286102",
    }),

  tipo: string().min(1, "El tipo es obligatorio"),
  idRefineria: object({
    id: string().optional(),
  }).optional(),
  representanteLegal: string().min(1, "El representante legal es obligatorio"),
  ciudad: string().min(1, "La ciudad es obligatoria"),
  estado: string().min(1, "El estado es obligatorio").optional(),
  eliminado: boolean().default(false),
  createdAt: string().optional(),
  updatedAt: string().optional(),
});

export const contratoSchema = object({
  id: string().optional(),
  numeroContrato: string({
    required_error: "El número de contrato es obligatorio",
  }).min(1, "El número de contrato es obligatorio"),
  descripcion: string({
    required_error: "La descripción es obligatoria",
  }).min(1, "La descripción es obligatoria"),
  tipoContrato: string({
    required_error: "El tipo de contrato es obligatorio",
  }).min(1, "El tipo de contrato es obligatorio"),
  estadoContrato: string({
    required_error: "El estado del contrato es obligatorio",
  }).min(1, "El estado del contrato es obligatorio"),
  estadoEntrega: string({
    required_error: "El estado de entrega es obligatorio",
  }).min(1, "El estado de entrega es obligatorio"),
  eliminado: boolean().default(false),
  fechaInicio: union([
    string({ required_error: "La fecha de inicio es obligatoria" }),
    date({ required_error: "La fecha de inicio es obligatoria" }),
  ]),
  fechaFin: union([
    string({
      required_error: "La fecha de fin es obligatoria",
    }),
    date({
      required_error: "La fecha de fin es obligatoria",
    }),
  ]),

  brent: number({ required_error: "El valor de brent es obligatorio" })
    .min(0.000001, "El valor de brent es obligatorio")
    .optional(),
  montoTotal: number().optional(),
  montoTransporte: number().optional(),

  // Referencias
  idRefineria: object({
    _id: string().optional(),
    nombre: string().min(1, "El nombre de la refinería es obligatorio"),
    id: string().optional(),
  }).optional(),

  idContacto: z.object(
    {
      id: z.string().optional(),
      nombre: z
        .string({
          required_error: "El nombre del proveedor es obligatorio",
        })
        .min(1, "El nombre del proveedor es obligatorio"),
    },
    { required_error: "Debe seleccionar un proveedor" }
  ),
  // Condiciones de pago
  condicionesPago: object({
    tipo: string({
      required_error: "El tipo de condiciones de pago es obligatorio",
    }).min(1, "El tipo de condiciones de pago es obligatorio"),
    plazo: number({
      required_error: "El plazo es obligatorio",
    }).min(0, "El plazo debe ser un número no negativo"),
  }),

  // Abonos
  abono: array(
    object({
      _id: string().optional(),
      monto: number().min(0, "El monto debe ser un número no negativo"),
      fecha: union([string(), date()]).optional(),
    })
  ).optional(),

  /**
   * idItems: aquí agregamos los campos
   * que reflejan la estructura de tu snippet de Mongoose
   * (producto, brent, convenio, montoTransporte, etc.).
   */
  idItems: array(
    object({
      id: string().optional(),
      _id: string().optional(),
      eliminado: boolean().default(false),

      // Referencia al producto
      producto: object({
        nombre: string().min(1, "El nombre del producto es obligatorio"),
        id: string().min(1, "El ID del producto es obligatorio"),
      }),
      ipTipoProducto: object({
        nombre: string().min(1, "El nombre del producto es obligatorio"),
        id: string().min(1, "El ID del producto es obligatorio"),
      }).optional(),

      cantidad: number().min(0, "La cantidad debe ser un número no negativo"),
      precioUnitario: number().optional(),

      brent: number().optional(),
      convenio: number().optional(),
      montoTransporte: number()
        .min(0, "El monto de transporte debe ser un número no negativo")
        .optional(),

      // Características del producto
      clasificacion: string()
        .min(1, "La clasificación es obligatoria")
        .optional(),
      gravedadAPI: number()
        .min(0, "La gravedad API debe ser un número no negativo")
        .optional(),
      azufre: number()
        .min(0, "El porcentaje de azufre debe ser un número no negativo")
        .optional(),
      contenidoAgua: number()
        .min(0, "El contenido de agua debe ser un número no negativo")
        .optional(),
      puntoDeInflamacion: number()
        .min(0, "El Flashpoint es obligatorio")
        .optional(),

      // Estado local de cada item
      estado: string().optional(),
    }),
    { required_error: "El contrato debe tener al menos un ítem." }
  ),

  /**
   * Campos alternativos para items (si tuvieras otra colección con la misma estructura).
   * Ajusta o elimina si no lo estás usando.
   */
  items: array(
    object({
      id: string().optional(),
      _id: string().optional(),

      eliminado: boolean().default(false),

      // Referencia al producto
      producto: object({
        nombre: string().min(1, "El nombre del producto es obligatorio"),
        id: string().min(1, "El ID del producto es obligatorio"),
      }),
      ipTipoProducto: object({
        nombre: string().min(1, "El nombre del producto es obligatorio"),
        id: string().min(1, "El ID del producto es obligatorio"),
      }),
      cantidad: number().min(0, "La cantidad debe ser un número no negativo"),
      precioUnitario: number().min(
        0,
        "El precio unitario debe ser un número no negativo"
      ),

      brent: number()
        .min(0, "El valor de brent debe ser un número no negativo")
        .optional(),
      convenio: number()
        .min(0, "El porcentaje de convenio debe ser un número no negativo")
        .optional(),
      montoTransporte: number()
        .min(0, "El monto de transporte debe ser un número no negativo")
        .optional(),

      // Características del producto
      clasificacion: string()
        .min(1, "La clasificación es obligatoria")
        .optional(),
      gravedadAPI: number()
        .min(0, "La gravedad API debe ser un número no negativo")
        .optional(),
      azufre: number()
        .min(0, "El porcentaje de azufre debe ser un número no negativo")
        .optional(),
      contenidoAgua: number()
        .min(0, "El contenido de agua debe ser un número no negativo")
        .optional(),
      puntoDeInflamacion: number()
        .min(0, "El Flashpoint es obligatorio")
        .optional(),

      // Estado local de cada item
      estado: string().optional(),
    })
  ).optional(),
});
export const abonoSchema = object({
  idContrato: object({
    // Puedes expandir los campos según la interfaz Contrato
    id: string().min(1, "El ID del contrato es obligatorio"),
    numeroContrato: string().optional(),
    descripcion: string().optional(),
    tipoContrato: string().optional(),
    estadoContrato: string().optional(),
    estadoEntrega: string().optional(),
    eliminado: boolean().optional(),
    fechaInicio: string().optional(),
    fechaFin: string().optional(),
    createdAt: string().optional(),
    updatedAt: string().optional(),
    brent: number().optional(),
    montoTotal: number().optional(),
    montoTransporte: number().optional(),
    idRefineria: object({}).optional(),
    idContacto: object({}).optional(),
    idItems: array(object({})).optional(),
    condicionesPago: object({}).optional(),
    abono: array(object({})).optional(),
    clausulas: array(object({})).optional(),
    historialModificaciones: array(object({})).optional(),
    createdBy: object({}).optional(),
    modificadoPor: object({}).optional(),
    historial: array(object({})).optional(),
  }),
  monto: number().min(0, "El monto debe ser un número no negativo"),
  fecha: union([string().min(1, "La fecha es obligatoria"), date()]),
  tipoOperacion: string().min(1, "El tipo de operación es obligatorio"),
  referencia: string().min(1, "La referencia es obligatoria"),
  tipoAbono: string().optional(),
  eliminado: boolean().default(false),
  id: string().optional(),
});
