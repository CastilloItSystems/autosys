/**
 * Sales Export Controller
 * Handles file exports for all sales reports
 */

import { Request, Response } from 'express'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'
import { logReportExport } from '../../../../services/audit.service.js'
import { getByPeriodReport } from '../byPeriod/byPeriod.service.js'
import { getByCustomerReport } from '../byCustomer/byCustomer.service.js'
import { getByProductReport } from '../byProduct/byProduct.service.js'
import { getOrderPipelineReport } from '../orderPipeline/orderPipeline.service.js'
import { getPaymentMethodsReport } from '../paymentMethods/paymentMethods.service.js'
import { getPendingInvoicesReport } from '../pendingInvoices/pendingInvoices.service.js'
import { exportDataToExcel } from '../../../inventory/reports/exports/excel.service.js'
import { generatePDFReport, EmpresaInfo } from '../../../inventory/reports/exports/pdf.service.js'
import prisma from '../../../../services/prisma.service.js'

type ExportFormat = 'csv' | 'excel' | 'pdf'

interface ExportColumn {
  header: string
  key: string
  width?: number
  align?: 'left' | 'center' | 'right'
  format?: 'number' | 'currency' | 'date' | 'percent' | 'text'
}

type SalesReportType =
  | 'by-period'
  | 'by-customer'
  | 'by-product'
  | 'order-pipeline'
  | 'payment-methods'
  | 'pending-invoices'

export const exportSalesReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { reportType } = req.params
    const empresaId = (req as any).empresaId as string | undefined

    // Fetch empresa info for PDF header
    let empresa: EmpresaInfo | undefined
    if (empresaId) {
      const raw = await prisma.empresa.findUnique({
        where: { id_empresa: empresaId },
        select: { nombre: true, numerorif: true, direccion: true, telefonos: true, email: true },
      })
      if (raw) empresa = raw
    }

    let format: ExportFormat = 'csv'
    const formatParam = req.query.format
    if (typeof formatParam === 'string' && ['csv', 'excel', 'pdf'].includes(formatParam)) {
      format = formatParam as ExportFormat
    }

    const filters: any = {}
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom as string
    if (req.query.dateTo) filters.dateTo = req.query.dateTo as string
    if (req.query.granularity) filters.granularity = req.query.granularity as string
    if (req.query.customerId) filters.customerId = req.query.customerId as string
    if (req.query.currency) filters.currency = req.query.currency as string
    if (req.query.search) filters.search = req.query.search as string

    let fileName = `ventas_${reportType}_${new Date().toISOString().split('T')[0]}`
    let data: any[] = []
    let columns: ExportColumn[] = []

    switch (reportType as SalesReportType) {
      case 'by-period': {
        const result = await getByPeriodReport(1, 1000, empresaId, undefined, filters)
        data = result.data
        columns = [
          { header: 'Período', key: 'period', width: 90 },
          { header: 'Facturas', key: 'invoiceCount', width: 65, align: 'right', format: 'number' },
          { header: 'Subtotal', key: 'subtotal', width: 90, align: 'right', format: 'currency' },
          { header: 'IVA', key: 'taxAmount', width: 80, align: 'right', format: 'currency' },
          { header: 'IGTF', key: 'igtfAmount', width: 75, align: 'right', format: 'currency' },
          { header: 'Total', key: 'total', width: 90, align: 'right', format: 'currency' },
        ]
        break
      }

      case 'by-customer': {
        const result = await getByCustomerReport(1, 1000, empresaId, undefined, filters)
        data = result.data
        columns = [
          { header: 'Cliente', key: 'customerName' },
          { header: 'RIF / Cédula', key: 'taxId', width: 85 },
          { header: 'Tipo', key: 'customerType', width: 60, align: 'center' },
          { header: 'Facturas', key: 'invoiceCount', width: 55, align: 'right', format: 'number' },
          { header: 'Total Facturado', key: 'totalRevenue', width: 90, align: 'right', format: 'currency' },
          { header: 'Ticket Prom.', key: 'avgTicket', width: 80, align: 'right', format: 'currency' },
          { header: 'Última Fact.', key: 'lastInvoiceDate', width: 80, format: 'date' },
        ]
        break
      }

      case 'by-product': {
        const result = await getByProductReport(1, 1000, empresaId, undefined, filters)
        data = result.data
        columns = [
          { header: 'Producto', key: 'itemName' },
          { header: 'SKU', key: 'sku', width: 75, align: 'center' },
          { header: 'Cantidad', key: 'totalQuantity', width: 65, align: 'right', format: 'number' },
          { header: 'Facturas', key: 'invoiceCount', width: 55, align: 'right', format: 'number' },
          { header: 'Precio Prom.', key: 'avgUnitPrice', width: 80, align: 'right', format: 'currency' },
          { header: 'Revenue Total', key: 'totalRevenue', width: 90, align: 'right', format: 'currency' },
          { header: 'Descuentos', key: 'totalDiscount', width: 80, align: 'right', format: 'currency' },
        ]
        break
      }

      case 'order-pipeline': {
        const result = await getOrderPipelineReport(empresaId)
        data = result.byStatus
        columns = [
          { header: 'Estado', key: 'status', width: 130 },
          { header: 'Cantidad', key: 'count', width: 80, align: 'right', format: 'number' },
          { header: 'Valor Total', key: 'totalValue', width: 170, align: 'right', format: 'currency' },
          { header: 'Valor Promedio', key: 'avgValue', width: 135, align: 'right', format: 'currency' },
        ]
        break
      }

      case 'payment-methods': {
        const result = await getPaymentMethodsReport(empresaId, undefined, filters)
        data = result.data
        columns = [
          { header: 'Método', key: 'method', width: 100 },
          { header: 'Cantidad', key: 'count', width: 65, align: 'right', format: 'number' },
          { header: 'Monto Total', key: 'totalAmount', width: 100, align: 'right', format: 'currency' },
          { header: '% del Total', key: 'percentage', width: 75, align: 'right', format: 'percent' },
          { header: 'IGTF', key: 'igtfAmount', width: 90, align: 'right', format: 'currency' },
          { header: 'Prom. por Pago', key: 'avgAmount', width: 90, align: 'right', format: 'currency' },
        ]
        break
      }

      case 'pending-invoices': {
        const result = await getPendingInvoicesReport(1, 1000, empresaId)
        data = result.data
        columns = [
          { header: 'Nro. Pre-Factura', key: 'preInvoiceNumber', width: 100 },
          { header: 'Cliente', key: 'customerName' },
          { header: 'RIF / Cédula', key: 'taxId', width: 80 },
          { header: 'Almacén', key: 'warehouseName', width: 80 },
          { header: 'Total', key: 'total', width: 75, align: 'right', format: 'currency' },
          { header: 'Moneda', key: 'currency', width: 50, align: 'center' },
          { header: 'Días Espera', key: 'daysWaiting', width: 65, align: 'right', format: 'number' },
        ]
        break
      }

      default:
        ApiResponse.error(res, `Tipo de reporte desconocido: ${reportType}`, 400)
        return
    }

    let buffer: Buffer | null = null

    if (format === 'excel') {
      buffer = await exportDataToExcel(data, fileName, columns.map(c => ({ header: c.header, key: c.key })))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`)
    } else if (format === 'pdf') {
      buffer = await generatePDFReport(data, `Reporte Ventas — ${reportType}`, columns, empresa)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`)
    } else {
      buffer = Buffer.from(convertToCSV(data), 'utf-8')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`)
    }

    if (buffer) {
      await logReportExport(reportType as string, format, req, filters)
      res.send(buffer)
    } else {
      ApiResponse.error(res, 'No se pudo generar el archivo', 500)
    }
  } catch (error: any) {
    console.error('Error exporting sales report:', error)
    ApiResponse.error(res, error.message, 500)
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const v = row[h]
        if (v === null || v === undefined) return ''
        const s = String(v)
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
      })
      .join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export default { exportSalesReportHandler }
