// backend/src/features/sales/shared/utils/orderNumberGenerator.ts

import prisma from '../../../../services/prisma.service'


export class OrderNumberGenerator {
  /**
   * Genera número de pedido: PED-2024-00001
   */
  static async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const basePattern = `PED-${year}-`

    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: basePattern,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    })

    let nextNumber = 1

    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `${basePattern}${String(nextNumber).padStart(5, '0')}`
  }

  /**
   * Genera número de pre-factura: PRE-2024-00001
   */
  static async generatePreInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const basePattern = `PRE-${year}-`

    const lastPreInvoice = await prisma.preInvoice.findFirst({
      where: {
        preInvoiceNumber: {
          startsWith: basePattern,
        },
      },
      orderBy: {
        preInvoiceNumber: 'desc',
      },
    })

    let nextNumber = 1

    if (lastPreInvoice) {
      const lastNumber = parseInt(lastPreInvoice.preInvoiceNumber.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `${basePattern}${String(nextNumber).padStart(5, '0')}`
  }

  /**
   * Genera número de pago: PAG-2024-00001
   */
  static async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const basePattern = `PAG-${year}-`

    const lastPayment = await prisma.payment.findFirst({
      where: {
        paymentNumber: {
          startsWith: basePattern,
        },
      },
      orderBy: {
        paymentNumber: 'desc',
      },
    })

    let nextNumber = 1

    if (lastPayment) {
      const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `${basePattern}${String(nextNumber).padStart(5, '0')}`
  }

  /**
   * Genera número de factura: FAC-2024-00001
   */
  static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const basePattern = `FAC-${year}-`

    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: basePattern,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    })

    let nextNumber = 1

    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `${basePattern}${String(nextNumber).padStart(5, '0')}`
  }

  /**
   * Genera número de control fiscal (SENIAT - Venezuela)
   */
  static async generateFiscalNumber(): Promise<string> {
    // Este es un ejemplo simplificado
    // En producción, debes integrarte con el sistema fiscal de SENIAT
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')

    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        fiscalNumber: {
          not: null,
        },
      },
      orderBy: {
        fiscalNumber: 'desc',
      },
    })

    let nextNumber = 1

    if (lastInvoice && lastInvoice.fiscalNumber) {
      const parts = lastInvoice.fiscalNumber.split('-')
      const lastNumber = parseInt(parts[parts.length - 1])
      nextNumber = lastNumber + 1
    }

    return `FCL-${year}${month}-${String(nextNumber).padStart(8, '0')}`
  }

  /**
   * Genera código de cliente: CLI-00001
   */
  static async generateCustomerCode(): Promise<string> {
    const lastCustomer = await prisma.customer.findFirst({
      where: {
        code: {
          startsWith: 'CLI-',
        },
      },
      orderBy: {
        code: 'desc',
      },
    })

    let nextNumber = 1

    if (lastCustomer) {
      const lastNumber = parseInt(lastCustomer.code.split('-')[1])
      nextNumber = lastNumber + 1
    }

    return `CLI-${String(nextNumber).padStart(5, '0')}`
  }
}
