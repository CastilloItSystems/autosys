import { array, boolean, date, number, object, string, union, z } from "zod";

export const contactoBKSchema = object({
  id: string().optional(),
  nombre: string().min(1, "La razon es obligatoria"),
  identificacionFiscal: string()
    .regex(/^[0-9-]+$/, {
      message: "El NIT solo puede contener números y el carácter '-'",
    })
    .min(8, { message: "El NIT debe tener al menos 8 caracteres" }) // Valida longitud mínima
    .max(13, { message: "El NIT no puede tener más de 13 caracteres" }), // Valida longitud máxima
  correo: string().email("El correo debe ser válido"),
  direccion: string().min(1, "La dirección es obligatoria"),
  telefono: number()
    .min(1000000, { message: "El teléfono debe tener al menos 7 dígitos" })
    .max(9999999999, {
      message: "El teléfono no puede tener más de 10 dígitos",
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

export const contratoBKSchema = object({
  // Ejemplo de campo adicional
  id: string().optional(),
  numeroContrato: string().min(1, "El número de contrato es obligatorio"),
  descripcion: string().min(1, "La descripción es obligatoria"),
  tipoContrato: string().min(1, "El tipo de contrato es obligatorio"), // Ejemplo: "Compra"
  estadoContrato: string().min(1, "El estado del contrato es obligatorio"), // Ejemplo: "Adjudicado"
  estadoEntrega: string().min(1, "El estado de entrega es obligatorio"), // Ejemplo: "Pendiente"
  eliminado: boolean().default(false),
  fechaInicio: union([string(), date()]).optional(),
  fechaFin: union([string(), date()]).optional(),
  createdAt: union([string(), date()]).optional(),
  updatedAt: union([string(), date()]).optional(),
  brent: number().optional(),
  montoTotal: number().optional(),
  montoTransporte: number().optional(),

  // Referencias
  idBunkering: object({
    _id: string().optional(),
    nombre: string().min(1, "El nombre de la refinería es obligatorio"),
    id: string().optional(),
  }).optional(),

  idContacto: object({
    id: string().optional(),
    nombre: string().min(1, "El nombre del contacto es obligatorio"),
  }),

  // Condiciones de pago
  condicionesPago: object({
    tipo: string().min(1, "El tipo de condiciones de pago es obligatorio"),
    plazo: number().min(0, "El plazo debe ser un número no negativo"),
  }).optional(),

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
    })
  ).optional(),

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
  // Clausulas
  clausulas: array(string()).optional(),

  // Historial de modificaciones

  historialModificaciones: array(
    object({
      id: string().optional(),
      fecha: string().optional(),
      descripcion: string().optional(),
    })
  ).optional(),
});
