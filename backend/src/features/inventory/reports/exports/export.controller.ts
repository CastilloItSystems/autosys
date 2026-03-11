/**
 * Export Controller
 * Handles file exports for all inventory reports
 */

import { Request, Response } from 'express'
import { ApiResponse } from '../../../../shared/utils/apiResponse'
import { logReportExport } from '../../../../services/audit.service'
import { getLowStockReport } from '../lowStock/lowStock.service'
import { getDeadStockReport } from '../deadStock/deadStock.service'
import { getStockValueReport } from '../stockValue/stockValue.service'
import { getMovementsReport } from '../movements/movements.service'
import { exportDataToExcel } from './excel.service'
import { generatePDFReport } from './pdf.service'

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
          { header: 'Item Name', key: 'itemName' },
          { header: 'SKU', key: 'itemSKU' },
          { header: 'Current Stock', key: 'currentStock' },
          { header: 'Minimum Stock', key: 'minimumStock' },
          { header: 'Shortage', key: 'shortage' },
          { header: 'Warehouse', key: 'warehouseName' },
        ]
        fileName += '_low-stock'
        break
      }

      case 'dead-stock': {
        const result = await getDeadStockReport(page, limit)
        data = result.data
        columns = [
          { header: 'Item Name', key: 'itemName' },
          { header: 'SKU', key: 'itemSKU' },
          { header: 'Current Stock', key: 'currentStock' },
          { header: 'Last Movement', key: 'lastMovement' },
          { header: 'Days Inactive', key: 'daysInactive' },
          { header: 'Warehouse', key: 'warehouseName' },
        ]
        fileName += '_dead-stock'
        break
      }

      case 'stock-value': {
        const result = await getStockValueReport(page, limit)
        data = result.data
        columns = [
          { header: 'Item Name', key: 'itemName' },
          { header: 'SKU', key: 'itemSKU' },
          { header: 'Quantity', key: 'quantity' },
          { header: 'Unit Price', key: 'unitPrice' },
          { header: 'Total Value', key: 'totalValue' },
          { header: 'Warehouse', key: 'warehouseName' },
        ]
        fileName += '_stock-value'
        break
      }

      case 'movements': {
        const result = await getMovementsReport({
          page,
          limit,
          ...filters,
        })
        data = result.data
        columns = [
          { header: 'Movement Date', key: 'movementDate' },
          { header: 'Item Name', key: 'itemName' },
          { header: 'SKU', key: 'itemSKU' },
          { header: 'Type', key: 'type' },
          { header: 'Quantity', key: 'quantity' },
          { header: 'Warehouse From', key: 'warehouseFromName' },
          { header: 'Warehouse To', key: 'warehouseToName' },
          { header: 'Reference', key: 'reference' },
        ]
        fileName += '_movements'
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
      buffer = await generatePDFReport(data, `${reportType} Report`, columns)
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
