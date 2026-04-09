/**
 * Export Controller
 * Handles file exports for all inventory reports
 */

import { Request, Response } from 'express'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'
import { logReportExport } from '../../../../services/audit.service.js'
import { getLowStockReport } from '../lowStock/lowStock.service.js'
import { getDeadStockReport } from '../deadStock/deadStock.service.js'
import { getStockValueReport } from '../stockValue/stockValue.service.js'
import { getMovementsReport } from '../movements/movements.service.js'
import { exportDataToExcel } from './excel.service.js'
import { generatePDFReport, EmpresaInfo } from './pdf.service.js'
import prisma from '../../../../services/prisma.service.js'

type ReportType = 'low-stock' | 'dead-stock' | 'stock-value' | 'movements'

type ExportFormat = 'csv' | 'excel' | 'pdf'

/**
 * Export report in requested format
 */
export const exportReportHandler = async (
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

    // Ensure format is a valid string, defaulting to 'csv'
    let format: ExportFormat = 'csv'
    const formatParam = req.query.format
    if (
      typeof formatParam === 'string' &&
      ['csv', 'excel', 'pdf'].includes(formatParam)
    ) {
      format = formatParam as ExportFormat
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 1000 // Higher limit for exports

    // Extract filters from query
    const filters: any = {}
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom as string
    if (req.query.dateTo) filters.dateTo = req.query.dateTo as string
    if (req.query.warehouseId)
      filters.warehouseId = req.query.warehouseId as string
    if (req.query.itemId) filters.itemId = req.query.itemId as string
    if (req.query.type) filters.type = req.query.type as string

    let fileName = `${reportType}_${new Date().toISOString().split('T')[0]}`
    let data: any[] = []
    let columns: any[] = []
    let buffer: Buffer | null = null

    // Fetch data based on report type
    switch (reportType as ReportType) {
      case 'low-stock': {
        const result = await getLowStockReport(page, limit)
        data = result.data
        columns = [
          { header: 'Artículo', key: 'itemName' },
          { header: 'SKU', key: 'itemSKU', width: 80 },
          { header: 'Stock Actual', key: 'currentStock', width: 80, align: 'right', format: 'number' },
          { header: 'Stock Mínimo', key: 'minimumStock', width: 80, align: 'right', format: 'number' },
          { header: 'Déficit', key: 'shortage', width: 65, align: 'right', format: 'number' },
          { header: 'Almacén', key: 'warehouseName', width: 100 },
        ]
        fileName += '_stock-bajo'
        break
      }

      case 'dead-stock': {
        const result = await getDeadStockReport(page, limit)
        data = result.data
        columns = [
          { header: 'Artículo', key: 'itemName' },
          { header: 'SKU', key: 'itemSKU', width: 80 },
          { header: 'Stock', key: 'currentStock', width: 65, align: 'right', format: 'number' },
          { header: 'Última Movimiento', key: 'lastMovement', width: 100, format: 'date' },
          { header: 'Días Inactivo', key: 'daysInactive', width: 80, align: 'right', format: 'number' },
          { header: 'Almacén', key: 'warehouseName', width: 90 },
        ]
        fileName += '_stock-muerto'
        break
      }

      case 'stock-value': {
        const result = await getStockValueReport(page, limit)
        data = result.data
        columns = [
          { header: 'Artículo', key: 'itemName' },
          { header: 'SKU', key: 'itemSKU', width: 75 },
          { header: 'Cantidad', key: 'quantity', width: 65, align: 'right', format: 'number' },
          { header: 'Precio Unit.', key: 'unitPrice', width: 80, align: 'right', format: 'currency' },
          { header: 'Valor Total', key: 'totalValue', width: 85, align: 'right', format: 'currency' },
          { header: 'Almacén', key: 'warehouseName', width: 90 },
        ]
        fileName += '_valoracion-stock'
        break
      }

      case 'movements': {
        const result = await getMovementsReport({ page, limit, ...filters })
        data = result.data
        columns = [
          { header: 'Fecha', key: 'movementDate', width: 80, format: 'date' },
          { header: 'Artículo', key: 'itemName' },
          { header: 'SKU', key: 'itemSKU', width: 70 },
          { header: 'Tipo', key: 'type', width: 65, align: 'center' },
          { header: 'Cantidad', key: 'quantity', width: 60, align: 'right', format: 'number' },
          { header: 'Almacén Origen', key: 'warehouseFromName', width: 85 },
          { header: 'Almacén Destino', key: 'warehouseToName', width: 85 },
        ]
        fileName += '_movimientos'
        break
      }

      default:
        ApiResponse.error(res, `Unknown report type: ${reportType}`, 400)
        return
    }

    // Generate file based on format
    if (format === 'excel') {
      buffer = await exportDataToExcel(data, fileName, columns)
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}.xlsx"`
      )
    } else if (format === 'pdf') {
      buffer = await generatePDFReport(data, `${reportType} Report`, columns, empresa)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}.pdf"`
      )
    } else {
      // CSV format (default)
      const csv = convertToCSV(data)
      buffer = Buffer.from(csv, 'utf-8')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}.csv"`
      )
    }

    // Send file
    if (buffer) {
      // Log export in audit trail (reportType is guaranteed to exist from params)
      await logReportExport(reportType as string, format, req, filters)
      res.send(buffer)
    } else {
      ApiResponse.error(res, 'Failed to generate export', 500)
    }
  } catch (error: any) {
    console.error('Error exporting report:', error)
    ApiResponse.error(res, error.message, 500)
  }
}

/**
 * Convert array of objects to CSV string
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return ''
  }

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escape quotes and wrap in quotes if contains comma
          if (value === null || value === undefined) {
            return ''
          }
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(',')
    ),
  ]

  return csv.join('\n')
}

export default { exportReportHandler }
