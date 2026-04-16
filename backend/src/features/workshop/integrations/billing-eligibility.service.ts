import type {
  PrismaClient,
  ServiceOrderItem,
} from '../../../generated/prisma/client.js'
import { NotFoundError } from '../../../shared/utils/apiError.js'
import { syncServiceOrderItems } from './billing-sync.service.js'

type PrismaClientType =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

export const APPROVED_WORKSHOP_QUOTATION_STATUSES = [
  'APPROVED_TOTAL',
  'APPROVED_PARTIAL',
  'CONVERTED',
] as const

const BILLABLE_MATERIAL_STATUSES = new Set([
  'DISPATCHED',
  'CONSUMED',
  'RETURNED',
])
const BILLABLE_ADDITIONAL_STATUSES = new Set(['APPROVED', 'EXECUTED'])
const BILLABLE_TOT_STATUSES = new Set(['RETURNED', 'INVOICED'])

export async function getBillableServiceOrderItems(
  prisma: PrismaClientType,
  serviceOrderId: string,
  empresaId?: string
): Promise<{
  serviceOrder: any
  billableItems: ServiceOrderItem[]
  hasApprovedQuotation: boolean
}> {
  // Forzar sincronización operativa antes de evaluar elegibilidad
  await syncServiceOrderItems(prisma, serviceOrderId)

  const serviceOrder = await (prisma as PrismaClient).serviceOrder.findFirst({
    where: {
      id: serviceOrderId,
      ...(empresaId ? { empresaId } : {}),
    },
    include: {
      items: true,
      materials: {
        select: {
          id: true,
          status: true,
          clientApproved: true,
          quantityDispatched: true,
          quantityReturned: true,
        },
      },
      additionals: {
        select: {
          id: true,
          status: true,
          additionalItems: {
            select: {
              id: true,
              clientApproved: true,
            },
          },
        },
      },
      tots: {
        select: {
          id: true,
          status: true,
          clientPrice: true,
        },
      },
      quotations: {
        select: {
          id: true,
          status: true,
        },
      },
      preInvoice: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  })

  if (!serviceOrder) {
    throw new NotFoundError(`ServiceOrder ${serviceOrderId} not found`)
  }

  const hasApprovedQuotation = serviceOrder.quotations.some((q: any) =>
    APPROVED_WORKSHOP_QUOTATION_STATUSES.includes(q.status as any)
  )

  const materialsById = new Map(
    serviceOrder.materials.map((m: any) => [m.id, m])
  )

  const additionalItemsById = new Map<
    string,
    { additionalStatus: string; clientApproved: boolean }
  >()

  for (const additional of serviceOrder.additionals) {
    for (const addItem of additional.additionalItems) {
      additionalItemsById.set(addItem.id, {
        additionalStatus: additional.status,
        clientApproved: addItem.clientApproved === true,
      })
    }
  }

  const totsById = new Map(serviceOrder.tots.map((t: any) => [t.id, t]))

  const billableItems = (serviceOrder.items as ServiceOrderItem[]).filter(
    (item: any) => {
      const sourceType = item.sourceType ?? 'MANUAL'
      const sourceRefId = item.sourceRefId ? String(item.sourceRefId) : null

      if (sourceType === 'MANUAL') {
        if (item.type === 'LABOR' || item.type === 'OTHER') {
          return item.status === 'COMPLETED' || hasApprovedQuotation
        }

        return item.status === 'COMPLETED'
      }

      if (sourceType === 'MATERIAL') {
        if (!sourceRefId) return false
        const material = materialsById.get(sourceRefId)
        if (!material) return false
        return (
          material.clientApproved === true &&
          BILLABLE_MATERIAL_STATUSES.has(material.status) &&
          Number(item.quantity) > 0
        )
      }

      if (sourceType === 'ADDITIONAL') {
        if (!sourceRefId) return false
        const addMeta = additionalItemsById.get(sourceRefId)
        if (!addMeta) return false
        return (
          addMeta.clientApproved &&
          BILLABLE_ADDITIONAL_STATUSES.has(addMeta.additionalStatus) &&
          Number(item.quantity) > 0
        )
      }

      if (sourceType === 'TOT') {
        if (!sourceRefId) return false
        const tot = totsById.get(sourceRefId)
        if (!tot) return false
        return (
          BILLABLE_TOT_STATUSES.has(tot.status) &&
          Number(tot.clientPrice ?? 0) > 0 &&
          Number(item.quantity) > 0
        )
      }

      // Compatibilidad para valores desconocidos de sourceType
      return item.status === 'COMPLETED' || hasApprovedQuotation
    }
  )

  return { serviceOrder, billableItems, hasApprovedQuotation }
}
