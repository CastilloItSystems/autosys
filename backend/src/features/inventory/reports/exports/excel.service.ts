/**
 * Excel Export Service
 * Exports inventory data to Excel format using exceljs
 */

import ExcelJS from 'exceljs'

// Helper to format headers
const formatHeader = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper to determine column width
const getColumnWidth = (header: string): number => {
  const minWidth = 12
  const maxWidth = 40
  const width = header.length + 2
  return Math.min(Math.max(width, minWidth), maxWidth)
}

/**
 * Export generic data to Excel
 */
export async function exportDataToExcel(
  data: any[],
  sheetName: string = 'Sheet1',
  columns?: string[]
): Promise<Buffer> {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    if (!data || data.length === 0) {
      worksheet.columns = [
        { header: 'No data available', key: 'noData', width: 20 },
      ]
      return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>
    }

    // Get columns from first data object or use provided columns
    const headers = columns || Object.keys(data[0])

    // Set up columns with formatting
    worksheet.columns = headers.map((header) => ({
      header: formatHeader(header),
      key: header,
      width: getColumnWidth(formatHeader(header)),
    }))

    // Format header row
    worksheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    }
    worksheet.getRow(1).alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    }

    // Add data with formatting
    data.forEach((row, rowIndex) => {
      const excelRow = worksheet.addRow(
        headers.reduce((acc: any, header) => {
          acc[header] = row[header]
          return acc
        }, {})
      )

      // Zebra striping
      if (rowIndex % 2 === 0) {
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' },
        }
      }

      // Format numbers and dates
      headers.forEach((header) => {
        const cell = excelRow.getCell(header)
        const value = row[header]

        if (typeof value === 'number') {
          if (Number.isInteger(value)) {
            cell.numFmt = '#,##0'
          } else {
            cell.numFmt = '#,##0.00'
          }
        } else if (value instanceof Date) {
          cell.numFmt = 'yyyy-mm-dd hh:mm:ss'
        }
      })
    })

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw error
  }
}

/**
 * Export low stock report to Excel
 */
export async function exportLowStockToExcel(items: any[]): Promise<Buffer> {
  const data = items.map((item) => ({
    itemName: item.itemName,
    sku: item.sku,
    currentStock: item.currentStock,
    minimumStock: item.minimumStock,
    difference: item.difference,
    warehouse: item.warehouse,
    daysUntilStockout: item.daysUntilStockout,
  }))

  return exportDataToExcel(data, 'Low Stock Items')
}

/**
 * Export dead stock report to Excel
 */
export async function exportDeadStockToExcel(items: any[]): Promise<Buffer> {
  const data = items.map((item) => ({
    itemName: item.itemName,
    sku: item.sku,
    currentStock: item.currentStock,
    lastMovementAt: item.lastMovementAt
      ? new Date(item.lastMovementAt).toISOString()
      : 'Never',
    daysWithoutMovement: item.daysWithoutMovement,
    warehouse: item.warehouse,
  }))

  return exportDataToExcel(data, 'Dead Stock Items')
}

/**
 * Export stock value report to Excel
 */
export async function exportStockValueToExcel(items: any[]): Promise<Buffer> {
  const data = items.map((item) => ({
    itemName: item.itemName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalValue: item.totalValue,
    percentageOfTotal: item.percentageOfTotal,
    warehouse: item.warehouse,
  }))

  return exportDataToExcel(data, 'Stock Value')
}

/**
 * Export movements report to Excel
 */
export async function exportMovementsToExcel(
  movements: any[]
): Promise<Buffer> {
  const data = movements.map((movement) => ({
    movementDate: movement.movementDate
      ? new Date(movement.movementDate).toISOString().split('T')[0]
      : '',
    itemName: movement.itemName,
    sku: movement.sku,
    type: movement.type,
    quantity: movement.quantity,
    warehouse: movement.warehouse,
    reference: movement.reference || '',
  }))

  return exportDataToExcel(data, 'Movements')
}

/**
 * Export ABC analysis to Excel
 */
export async function exportABCAnalysisToExcel(items: any[]): Promise<Buffer> {
  const data = items.map((item) => ({
    itemName: item.itemName,
    sku: item.sku,
    totalMovementValue: item.totalMovementValue,
    movementCount: item.movementCount,
    percentageOfTotal: item.percentageOfTotal,
    cumulativePercentage: item.cumulativePercentage,
    classification: item.classification,
    trend: item.trend,
  }))

  return exportDataToExcel(data, 'ABC Analysis')
}

/**
 * Export turnover metrics to Excel
 */
export async function exportTurnoverToExcel(items: any[]): Promise<Buffer> {
  const data = items.map((item) => ({
    itemName: item.itemName,
    sku: item.sku,
    turnoverRatio: item.turnoverRatio,
    daysInventoryOutstanding: item.daysInventoryOutstanding,
    healthScore: item.healthScore,
    classification: item.classification,
    trend: item.trend,
    stockValue: item.stockValue,
  }))

  return exportDataToExcel(data, 'Turnover Analysis')
}

export default {
  exportDataToExcel,
  exportLowStockToExcel,
  exportDeadStockToExcel,
  exportStockValueToExcel,
  exportMovementsToExcel,
  exportABCAnalysisToExcel,
  exportTurnoverToExcel,
}
