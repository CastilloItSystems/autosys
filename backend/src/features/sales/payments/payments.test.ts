import { describe, test, expect, jest } from '@jest/globals'
import paymentsService from './payments.service.js'
import { PaymentMethod, PaymentStatus } from './payments.interface.js'

type AnyFn = ReturnType<typeof jest.fn>

function createMockDb(options?: {
  stockLocation?: string | null
  itemLocation?: string | null
  availableInSalesWarehouse?: number
  availableInOriginWarehouse?: number
  hasStockRecord?: boolean
  isWorkshopPreInvoice?: boolean
}) {
  const stockLocation =
    options && 'stockLocation' in options ? options.stockLocation : 'RACK-A1'
  const itemLocation =
    options && 'itemLocation' in options ? options.itemLocation : 'PASILLO-ITEM-1'
  const availableInSalesWarehouse = options?.availableInSalesWarehouse ?? 10
  const availableInOriginWarehouse = options?.availableInOriginWarehouse ?? 20
  const hasStockRecord = options?.hasStockRecord ?? true
  const isWorkshopPreInvoice = options?.isWorkshopPreInvoice ?? false

  const preInvoice = {
    id: 'pi-1',
    preInvoiceNumber: 'PREF-1',
    status: 'READY_FOR_PAYMENT',
    total: 100,
    customerId: 'cust-1',
    warehouseId: isWorkshopPreInvoice ? null : 'wh-1',
    serviceOrderId: isWorkshopPreInvoice ? 'so-1' : null,
    customer: { name: 'Cliente Test' },
    items: [
      {
        itemId: 'item-1',
        itemName: 'TOBERA INYECTOR',
        quantity: 2,
        item: { id: 'item-1', sku: 'SKU-1', name: 'TOBERA INYECTOR', location: itemLocation },
        unitPrice: 50,
        discountPercent: 0,
        discountAmount: 0,
        taxType: 'IVA',
        taxRate: 16,
        taxAmount: 16,
        subtotal: 100,
        totalLine: 116,
      },
    ],
    currency: 'USD',
    exchangeRate: 1,
    discountAmount: 0,
    subtotalBruto: 100,
    baseImponible: 100,
    baseExenta: 0,
    taxAmount: 16,
    taxRate: 16,
    igtfRate: 3,
    notes: null,
  }

  const tx = {
    payment: {
      create: jest.fn(async () => ({
        id: 'pay-1',
        paymentNumber: 'PAG-1',
        status: PaymentStatus.COMPLETED,
      })),
    },
    preInvoice: {
      findFirst: jest.fn(async () => preInvoice),
      update: jest.fn(async () => ({})),
    },
    invoice: {
      create: jest.fn(async () => ({ id: 'inv-1' })),
    },
    invoiceItem: {
      create: jest.fn(async () => ({})),
    },
    exitNote: {
      create: jest.fn(async () => ({ id: 'en-1' })),
    },
    exitNoteItem: {
      create: jest.fn(async () => ({})),
    },
    warehouse: {
      findFirst: jest.fn(async () => ({
        id: 'wh-1',
        code: 'PRINCIPAL',
        name: 'Almacén Principal',
      })),
    },
    stock: {
      findMany: jest.fn(async (args: any) => {
        if (args?.where?.warehouseId === 'wh-1') {
          if (availableInSalesWarehouse <= 0) return []
          return [
            {
              itemId: 'item-1',
              quantityAvailable: availableInSalesWarehouse,
            },
          ]
        }

        if (args?.where?.warehouseId?.not === 'wh-1') {
          if (availableInOriginWarehouse <= 0) return []
          return [
            {
              itemId: 'item-1',
              quantityAvailable: availableInOriginWarehouse,
              warehouseId: 'wh-2',
              warehouse: {
                id: 'wh-2',
                code: 'OBS-3',
                name: 'Almacén Observación',
              },
            },
          ]
        }

        return []
      }),
      findUnique: jest.fn(async () =>
        hasStockRecord
          ? {
              id: 'stock-1',
              location: stockLocation,
            }
          : null
      ),
      updateMany: jest.fn(async () => ({ count: availableInSalesWarehouse >= 2 ? 1 : 0 })),
    },
  }

  const db = {
    preInvoice: {
      findFirst: jest.fn(async () => preInvoice),
    },
    payment: {
      findMany: jest.fn(async () => []),
    },
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
  }

  return { db, tx }
}

describe('PaymentsService - ExitNote auto generation', () => {
  const baseInput = {
    preInvoiceId: 'pi-1',
    method: PaymentMethod.CASH,
    amount: 100,
    currency: 'USD',
  }

  test('debe guardar pickedFromLocation desde stock.location al crear exitNoteItem', async () => {
    const { db, tx } = createMockDb({ stockLocation: 'PASILLO-3-A' })

    await paymentsService.create(baseInput as any, 'empresa-1', 'user-1', db as any)

    expect((tx.exitNote.create as AnyFn).mock.calls.length).toBe(1)
    expect((tx.exitNoteItem.create as AnyFn).mock.calls.length).toBe(1)
    const exitNoteItemPayload = (tx.exitNoteItem.create as AnyFn).mock.calls[0][0]
    expect(exitNoteItemPayload.data.pickedFromLocation).toBe('PASILLO-3-A')
    expect((tx.stock.updateMany as AnyFn).mock.calls.length).toBe(1)
  })

  test('debe crear exitNoteItem con pickedFromLocation null cuando no hay ubicación en stock ni item', async () => {
    const { db, tx } = createMockDb({
      stockLocation: null,
      itemLocation: null,
      hasStockRecord: true,
    })

    await paymentsService.create(baseInput as any, 'empresa-1', 'user-1', db as any)

    expect((tx.exitNoteItem.create as AnyFn).mock.calls.length).toBe(1)
    const exitNoteItemPayload = (tx.exitNoteItem.create as AnyFn).mock.calls[0][0]
    expect(exitNoteItemPayload.data.pickedFromLocation).toBeNull()
  })

  test('debe usar item.location cuando stock.location viene null', async () => {
    const { db, tx } = createMockDb({
      stockLocation: null,
      itemLocation: 'ANAQUEL-B-07',
    })

    await paymentsService.create(baseInput as any, 'empresa-1', 'user-1', db as any)

    expect((tx.exitNoteItem.create as AnyFn).mock.calls.length).toBe(1)
    const exitNoteItemPayload = (tx.exitNoteItem.create as AnyFn).mock.calls[0][0]
    expect(exitNoteItemPayload.data.pickedFromLocation).toBe('ANAQUEL-B-07')
    expect((tx.stock.updateMany as AnyFn).mock.calls.length).toBe(1)
  })

  test('no debe crear exitNote para pre-facturas de taller', async () => {
    const { db, tx } = createMockDb({ isWorkshopPreInvoice: true })

    await paymentsService.create(baseInput as any, 'empresa-1', 'user-1', db as any)

    expect((tx.exitNote.create as AnyFn).mock.calls.length).toBe(0)
    expect((tx.exitNoteItem.create as AnyFn).mock.calls.length).toBe(0)
  })

  test('debe bloquear el pago final cuando falta stock en almacén de venta', async () => {
    const { db, tx } = createMockDb({
      availableInSalesWarehouse: 0,
      availableInOriginWarehouse: 5,
      hasStockRecord: false,
    })

    await expect(
      paymentsService.create(baseInput as any, 'empresa-1', 'user-1', db as any)
    ).rejects.toMatchObject({
      message:
        'No hay stock suficiente en el almacén de venta para completar esta venta.',
      errors: [
        expect.objectContaining({
          code: 'SALES_STOCK_SHORTAGE',
        }),
      ],
    })

    expect((tx.invoice.create as AnyFn).mock.calls.length).toBe(0)
    expect((tx.exitNote.create as AnyFn).mock.calls.length).toBe(0)
  })
})
