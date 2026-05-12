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

/**
 * Convierte un breakdown `Record<currency, number>` a string legible:
 * `"USD 500.00 | VES 18250.00"`. Devuelve `""` si está vacío.
 */
function formatBreakdown(obj: Record<string, number>): string {
  const entries = Object.entries(obj ?? {})
    .filter(([, n]) => n)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
  return entries.map(([c, n]) => `${c} ${n.toFixed(2)}`).join(' | ')
}

/**
 * Aplana rows pre-export:
 *  - Cualquier valor `Record<string, number>` (breakdown multi-moneda) se
 *    convierte en string `"USD 100.00 | VES 3600.00"` para que CSV/Excel/PDF
 *    no muestren JSON crudo.
 *  - Otros valores se mantienen.
 */
function normalizeRowsForExport(data: any[]): any[] {
  return data.map((row) => {
    const out: any = {}
    for (const [k, v] of Object.entries(row)) {
      if (
        v &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        !(v instanceof Date) &&
        Object.values(v as any).every((x) => typeof x === 'number')
      ) {
        out[k] = formatBreakdown(v as Record<string, number>)
      } else {
        out[k] = v
      }
    }
    return out
  })
}

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
          { header: 'Facturas', key: 'invoiceCount', width: 60, align: 'right', format: 'number' },
          { header: 'Subtotal (USD)', key: 'subtotalUSD', width: 90, align: 'right', format: 'currency' },
          { header: 'IVA (USD)', key: 'taxAmountUSD', width: 80, align: 'right', format: 'currency' },
          { header: 'IGTF (USD)', key: 'igtfAmountUSD', width: 80, align: 'right', format: 'currency' },
          { header: 'Total (USD)', key: 'totalUSD', width: 90, align: 'right', format: 'currency' },
          { header: 'Total por moneda', key: 'total', width: 160 },
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
          { header: 'Total Facturado (USD)', key: 'totalRevenueUSD', width: 100, align: 'right', format: 'currency' },
          { header: 'Ticket Prom. (USD)', key: 'avgTicketUSD', width: 90, align: 'right', format: 'currency' },
          { header: 'Total por moneda', key: 'totalRevenue', width: 160 },
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
          { header: 'Precio Prom. por moneda', key: 'avgUnitPrice', width: 140 },
          { header: 'Revenue (USD)', key: 'totalRevenueUSD', width: 95, align: 'right', format: 'currency' },
          { header: 'Revenue por moneda', key: 'totalRevenue', width: 160 },
          { header: 'Descuentos (USD)', key: 'totalDiscountUSD', width: 90, align: 'right', format: 'currency' },
        ]
        break
      }

      case 'order-pipeline': {
        const result = await getOrderPipelineReport(empresaId)
        data = result.byStatus
        columns = [
          { header: 'Estado', key: 'status', width: 130 },
          { header: 'Cantidad', key: 'count', width: 70, align: 'right', format: 'number' },
          { header: 'Valor Total (USD)', key: 'totalValueUSD', width: 110, align: 'right', format: 'currency' },
          { header: 'Valor por moneda', key: 'totalValue', width: 160 },
          { header: 'Valor Promedio (USD)', key: 'avgValueUSD', width: 120, align: 'right', format: 'currency' },
        ]
        break
      }

      case 'payment-methods': {
        const result = await getPaymentMethodsReport(empresaId, undefined, filters)
        data = result.data
        columns = [
          { header: 'Método', key: 'method', width: 100 },
          { header: 'Cantidad', key: 'count', width: 65, align: 'right', format: 'number' },
          { header: 'Monto (USD)', key: 'totalAmountUSD', width: 100, align: 'right', format: 'currency' },
          { header: 'Monto por moneda', key: 'totalAmount', width: 160 },
          { header: '% del Total', key: 'percentage', width: 75, align: 'right', format: 'percent' },
          { header: 'IGTF (USD)', key: 'igtfAmountUSD', width: 90, align: 'right', format: 'currency' },
          { header: 'Prom. por Pago (USD)', key: 'avgAmountUSD', width: 100, align: 'right', format: 'currency' },
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

    // Aplanar breakdowns multi-moneda a string legible
    data = normalizeRowsForExport(data)

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
      buffer = Buffer.from(convertToCSV(data, columns), 'utf-8')
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

/**
 * CSV usa el orden y headers definidos en `columns` (no `Object.keys`).
 * Esto garantiza consistencia con Excel/PDF y permite headers en español.
 */
function convertToCSV(data: any[], columns: ExportColumn[]): string {
  if (data.length === 0) return columns.map((c) => csvCell(c.header)).join(',')
  const header = columns.map((c) => csvCell(c.header)).join(',')
  const rows = data.map((row) =>
    columns.map((c) => csvCell(formatCell(row[c.key], c.format))).join(','),
  )
  return [header, ...rows].join('\n')
}

function formatCell(v: any, fmt?: ExportColumn['format']): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString().split('T')[0]
  if (fmt === 'currency' && typeof v === 'number') return v.toFixed(2)
  if (fmt === 'percent' && typeof v === 'number') return `${v.toFixed(2)}%`
  if (fmt === 'number' && typeof v === 'number') return String(v)
  return String(v)
}

function csvCell(s: string): string {
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

export default { exportSalesReportHandler }
