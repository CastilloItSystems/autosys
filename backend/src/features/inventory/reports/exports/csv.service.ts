/**
 * CSV Export Service
 * Exports inventory data to CSV format
 */

export async function exportInventoryToCSV(data: any[]): Promise<string> {
  if (!data || data.length === 0) {
    return ''
  }

  try {
    // Get headers from first object
    const headers = Object.keys(data[0])
    const csv: string[] = []

    // Add header row
    csv.push(headers.map((h) => `"${h}"`).join(','))

    // Add data rows
    data.forEach((row) => {
      const rowData = headers.map((header) => {
        const value = row[header]
        if (value === null || value === undefined) {
          return '""'
        }
        const stringValue = String(value).replace(/"/g, '""')
        return `"${stringValue}"`
      })
      csv.push(rowData.join(','))
    })

    return csv.join('\n')
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    throw error
  }
}

/**
 * Export report to CSV file
 */
export async function exportReportToCSV(
  filename: string,
  data: any[]
): Promise<Buffer> {
  const csv = await exportInventoryToCSV(data)
  return Buffer.from(csv, 'utf-8')
}

/**
 * Export stock levels to CSV
 */
export async function exportStockToCSV(stocks: any[]): Promise<string> {
  const data = stocks.map((s) => ({
    'Item ID': s.itemId,
    'Item Name': s.itemName,
    SKU: s.itemSKU,
    Warehouse: s.warehouseName,
    Quantity: s.quantity,
    'Unit Price': s.unitPrice,
    'Total Value': s.totalValue,
  }))

  return exportInventoryToCSV(data)
}

/**
 * Export movements to CSV
 */
export async function exportMovementsToCSV(movements: any[]): Promise<string> {
  const data = movements.map((m) => ({
    Date: m.createdAt,
    Item: m.itemName,
    Type: m.movementType,
    Quantity: m.quantity,
    Warehouse: m.warehouseName,
    Reference: m.reference,
    Notes: m.notes,
  }))

  return exportInventoryToCSV(data)
}

export default {
  exportInventoryToCSV,
  exportReportToCSV,
  exportStockToCSV,
  exportMovementsToCSV,
}
