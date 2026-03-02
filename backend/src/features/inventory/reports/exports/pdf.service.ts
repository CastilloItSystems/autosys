/**
 * PDF Export Service
 * Exports inventory reports to PDF format using pdfkit
 */

import PDFDocument from 'pdfkit'

/**
 * Helper to create a basic PDF table
 */
interface TableColumn {
  header: string
  key: string
  width: number
  align?: 'left' | 'center' | 'right'
}

const drawTable = (
  doc: InstanceType<typeof PDFDocument>,
  columns: TableColumn[],
  data: any[],
  startY: number
) => {
  const rowHeight = 20
  const headerHeight = 25
  let y = startY

  // Draw header
  doc.fillColor('#4472C4').rect(50, y, 500, headerHeight).fill()
  doc.fillColor('white').fontSize(11).font('Helvetica-Bold')

  let x = 50
  columns.forEach((col) => {
    doc.text(col.header, x + 5, y + 5, {
      width: col.width - 10,
      align: col.align || 'left',
    })
    x += col.width
  })

  y += headerHeight

  // Draw rows
  doc.fillColor('black').fontSize(10).font('Helvetica')
  data.forEach((row, idx) => {
    // Alternate row colors
    if (idx % 2 === 0) {
      doc.fillColor('#F2F2F2').rect(50, y, 500, rowHeight).fill()
    }

    doc.fillColor('black')
    x = 50
    columns.forEach((col) => {
      const value = row[col.key] || ''
      doc.text(String(value), x + 5, y + 5, {
        width: col.width - 10,
        align: col.align || 'left',
        height: rowHeight - 10,
        valign: 'center',
      })
      x += col.width
    })

    y += rowHeight

    // Add new page if needed
    if (y > 750) {
      doc.addPage()
      y = 50
    }
  })

  return y
}

/**
 * Generate PDF report with generic data
 */
export async function generatePDFReport(
  data: any[],
  reportTitle: string,
  columns: TableColumn[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument()
      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text(reportTitle, 50, 50)

      // Metadata
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666')
        .text(
          `Generated: ${new Date().toLocaleString('es-ES')} | Total Records: ${data.length}`,
          50,
          80
        )

      // Draw table
      let y = 120
      doc.fillColor('black')

      if (data.length > 0) {
        y = drawTable(doc, columns, data, y)
      } else {
        doc.fontSize(12).text('No data available', 50, y)
      }

      // Footer
      doc
        .fontSize(9)
        .fillColor('#999')
        .text(
          'AutoSys - Inventory Management System',
          50,
          doc.page.height - 30,
          {
            align: 'center',
          }
        )

      doc.end()
    } catch (error) {
      console.error('Error generating PDF:', error)
      reject(error)
    }
  })
}

/**
 * Export low stock report to PDF
 */
export async function generateLowStockPDF(items: any[]): Promise<Buffer> {
  const columns: TableColumn[] = [
    { header: 'Item Name', key: 'itemName', width: 140 },
    { header: 'SKU', key: 'sku', width: 80, align: 'center' },
    { header: 'Current', key: 'currentStock', width: 70, align: 'right' },
    { header: 'Minimum', key: 'minimumStock', width: 70, align: 'right' },
    { header: 'Warehouse', key: 'warehouse', width: 80, align: 'center' },
  ]

  return generatePDFReport(items, 'Low Stock Report', columns)
}

/**
 * Export dead stock report to PDF
 */
export async function generateDeadStockPDF(items: any[]): Promise<Buffer> {
  const columns: TableColumn[] = [
    { header: 'Item Name', key: 'itemName', width: 140 },
    { header: 'SKU', key: 'sku', width: 80, align: 'center' },
    { header: 'Stock', key: 'currentStock', width: 60, align: 'right' },
    {
      header: 'Days Without Movement',
      key: 'daysWithoutMovement',
      width: 100,
      align: 'right',
    },
    { header: 'Warehouse', key: 'warehouse', width: 80, align: 'center' },
  ]

  return generatePDFReport(items, 'Dead Stock Report', columns)
}

/**
 * Export stock value report to PDF
 */
export async function generateStockValuePDF(items: any[]): Promise<Buffer> {
  const columns: TableColumn[] = [
    { header: 'Item Name', key: 'itemName', width: 120 },
    { header: 'SKU', key: 'sku', width: 70, align: 'center' },
    { header: 'Quantity', key: 'quantity', width: 70, align: 'right' },
    { header: 'Unit Price', key: 'unitPrice', width: 80, align: 'right' },
    { header: 'Total Value', key: 'totalValue', width: 80, align: 'right' },
    { header: 'Warehouse', key: 'warehouse', width: 70, align: 'center' },
  ]

  return generatePDFReport(items, 'Stock Value Report', columns)
}

/**
 * Export movements report to PDF
 */
export async function generateMovementReportPDF(
  movements: any[]
): Promise<Buffer> {
  const columns: TableColumn[] = [
    { header: 'Date', key: 'movementDate', width: 90 },
    { header: 'Item', key: 'itemName', width: 120 },
    { header: 'Type', key: 'type', width: 70, align: 'center' },
    { header: 'Qty', key: 'quantity', width: 60, align: 'right' },
    { header: 'Warehouse', key: 'warehouse', width: 100, align: 'center' },
  ]

  return generatePDFReport(movements, 'Movements Report', columns)
}

/**
 * Export ABC analysis to PDF
 */
export async function generateABCAnalysisPDF(items: any[]): Promise<Buffer> {
  const columns: TableColumn[] = [
    { header: 'Item Name', key: 'itemName', width: 120 },
    { header: 'SKU', key: 'sku', width: 80, align: 'center' },
    {
      header: 'Total Value',
      key: 'totalMovementValue',
      width: 90,
      align: 'right',
    },
    {
      header: '% of Total',
      key: 'percentageOfTotal',
      width: 80,
      align: 'right',
    },
    {
      header: 'Cumulative %',
      key: 'cumulativePercentage',
      width: 80,
      align: 'right',
    },
    { header: 'Class', key: 'classification', width: 50, align: 'center' },
  ]

  return generatePDFReport(items, 'ABC Analysis Report', columns)
}

/**
 * Export turnover analysis to PDF
 */
export async function generateTurnoverPDF(items: any[]): Promise<Buffer> {
  const columns: TableColumn[] = [
    { header: 'Item Name', key: 'itemName', width: 120 },
    { header: 'SKU', key: 'sku', width: 80, align: 'center' },
    { header: 'Turnover', key: 'turnoverRatio', width: 70, align: 'right' },
    {
      header: 'DIO',
      key: 'daysInventoryOutstanding',
      width: 60,
      align: 'right',
    },
    { header: 'Health', key: 'healthScore', width: 60, align: 'right' },
    { header: 'Class', key: 'classification', width: 70, align: 'center' },
  ]

  return generatePDFReport(items, 'Turnover Analysis Report', columns)
}

export default {
  generatePDFReport,
  generateLowStockPDF,
  generateDeadStockPDF,
  generateStockValuePDF,
  generateMovementReportPDF,
  generateABCAnalysisPDF,
  generateTurnoverPDF,
}
