// backend/src/features/inventory/shared/constants/exitTypes.ts

export const EXIT_TYPES = {
  SALE: 'SALE',
  WARRANTY: 'WARRANTY',
  LOAN: 'LOAN',
  INTERNAL_USE: 'INTERNAL_USE',
  SAMPLE: 'SAMPLE',
  DONATION: 'DONATION',
  OWNER_PICKUP: 'OWNER_PICKUP',
  DEMO: 'DEMO',
  TRANSFER: 'TRANSFER',
  OTHER: 'OTHER',
  LOAN_RETURN: 'LOAN_RETURN',
} as const

export type ExitType = (typeof EXIT_TYPES)[keyof typeof EXIT_TYPES]

export const EXIT_TYPE_LABELS: Record<ExitType, string> = {
  SALE: 'Venta Normal',
  WARRANTY: 'Garantía',
  LOAN: 'Préstamo',
  INTERNAL_USE: 'Uso Interno',
  SAMPLE: 'Muestra',
  DONATION: 'Donación',
  OWNER_PICKUP: 'Retiro del Dueño',
  DEMO: 'Demostración',
  TRANSFER: 'Traslado',
  OTHER: 'Otro',
  LOAN_RETURN: 'Devolución de Préstamo',
}

export const EXIT_TYPE_DESCRIPTIONS: Record<ExitType, string> = {
  SALE: 'Salida vinculada a una venta con factura',
  WARRANTY: 'Reemplazo de repuesto defectuoso bajo garantía',
  LOAN: 'Préstamo temporal de herramienta o repuesto',
  INTERNAL_USE: 'Consumo para vehículos de la empresa',
  SAMPLE: 'Muestra para cliente potencial',
  DONATION: 'Donación de repuestos obsoletos o excedentes',
  OWNER_PICKUP: 'Retiro del propietario para uso personal',
  DEMO: 'Demostración en campo o evento',
  TRANSFER: 'Traslado entre almacenes',
  OTHER: 'Otro tipo de salida especial',
  LOAN_RETURN: 'Devolución de un préstamo anterior',
}

// Tipos que NO requieren factura
export const EXIT_TYPES_WITHOUT_INVOICE: ExitType[] = [
  EXIT_TYPES.WARRANTY,
  EXIT_TYPES.LOAN,
  EXIT_TYPES.INTERNAL_USE,
  EXIT_TYPES.SAMPLE,
  EXIT_TYPES.DONATION,
  EXIT_TYPES.OWNER_PICKUP,
  EXIT_TYPES.DEMO,
  EXIT_TYPES.TRANSFER,
  EXIT_TYPES.OTHER,
  EXIT_TYPES.LOAN_RETURN,
]

// Tipos que requieren autorización especial
export const EXIT_TYPES_REQUIRING_AUTHORIZATION: ExitType[] = [
  EXIT_TYPES.WARRANTY,
  EXIT_TYPES.DONATION,
  EXIT_TYPES.OWNER_PICKUP,
]

// Tipos que tienen fecha de devolución esperada
export const EXIT_TYPES_WITH_RETURN_DATE: ExitType[] = [
  EXIT_TYPES.LOAN,
  EXIT_TYPES.DEMO,
  EXIT_TYPES.SAMPLE,
]
