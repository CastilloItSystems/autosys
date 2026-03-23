/**
 * PDF Export Service
 * Professional report generation using pdfkit
 */

import PDFDocument from 'pdfkit'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TableColumn {
  header: string
  key: string
  width?: number
  align?: 'left' | 'center' | 'right'
  format?: 'number' | 'currency' | 'date' | 'percent' | 'text'
}

export interface EmpresaInfo {
  nombre: string
  numerorif?: string | null
  direccion?: string | null
  telefonos?: string | null
  email?: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_W = 595
const PAGE_H = 842
const MARGIN = 40
const TABLE_W = PAGE_W - MARGIN * 2   // 515px
const HEADER_H = 96                   // total height of main page header
const CONTENT_TOP = HEADER_H + 10    // y where table starts
const CONTENT_BOTTOM = PAGE_H - 45  // above footer

const C = {
  accent:       '#2563EB',  // blue-600
  accentDark:   '#1E3A5F',  // navy
  accentLight:  '#EFF6FF',  // blue-50 — alt row fill
  accentBorder: '#BFDBFE',  // blue-200
  white:        '#FFFFFF',
  text:         '#1E293B',  // slate-800
  muted:        '#475569',  // slate-600
  subtle:       '#94A3B8',  // slate-400
  divider:      '#E2E8F0',  // slate-200
  headerSub:    '#93C5FD',  // blue-300 — subtext on dark bg
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveWidths(columns: TableColumn[]): (TableColumn & { width: number })[] {
  const fixedTotal = columns.reduce((sum, c) => sum + (c.width ?? 0), 0)
  const autoCount = columns.filter((c) => !c.width).length
  const autoWidth = autoCount > 0 ? Math.floor((TABLE_W - fixedTotal) / autoCount) : 0
  return columns.map((c) => ({ ...c, width: c.width ?? autoWidth }))
}

function fmtValue(value: any, fmt?: TableColumn['format']): string {
  if (value === null || value === undefined || value === '') return '—'
  if (fmt === 'currency') {
    const n = Number(value)
    return isNaN(n) ? String(value) : n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (fmt === 'number') {
    const n = Number(value)
    return isNaN(n) ? String(value) : n.toLocaleString('es-VE')
  }
  if (fmt === 'percent') {
    const n = Number(value)
    return isNaN(n) ? String(value) : `${n.toFixed(1)}%`
  }
  if (fmt === 'date') {
    try { return new Date(value).toLocaleDateString('es-VE') } catch { return String(value) }
  }
  return String(value)
}

// ─── Page decorations ─────────────────────────────────────────────────────────

/**
 * Main header (page 1):
 *   Left  → empresa name, RIF, address/phone
 *   Right → report title + date/total
 */
function drawMainHeader(
  doc: InstanceType<typeof PDFDocument>,
  reportTitle: string,
  totalRecords: number,
  generatedAt: string,
  empresa?: EmpresaInfo
) {
  // Top accent stripe
  doc.rect(0, 0, PAGE_W, 5).fill(C.accent)

  // Navy block
  doc.rect(0, 5, PAGE_W, HEADER_H - 5).fill(C.accentDark)

  // ── Left: empresa identity ──────────────────────────────────
  const companyName = empresa?.nombre ?? 'Mi Empresa'
  doc.font('Helvetica-Bold').fontSize(15).fillColor(C.white).text(companyName, MARGIN, 16)

  const subLines: string[] = []
  if (empresa?.numerorif) subLines.push(`RIF: ${empresa.numerorif}`)
  if (empresa?.direccion) subLines.push(empresa.direccion)
  if (empresa?.telefonos) subLines.push(`Tel: ${empresa.telefonos}`)

  if (subLines.length > 0) {
    doc.font('Helvetica').fontSize(8).fillColor(C.headerSub)
      .text(subLines.join('   ·   '), MARGIN, 37, { width: TABLE_W * 0.55 })
  }

  // ── Right: report title + metadata ─────────────────────────
  const rightW = TABLE_W * 0.42
  const rightX = PAGE_W - MARGIN - rightW

  // Tag pill behind report title
  doc.roundedRect(rightX - 4, 12, rightW + 4, 22, 4).fill('#1E40AF')

  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.white)
    .text(reportTitle, rightX, 17, { width: rightW, align: 'right' })

  doc.font('Helvetica').fontSize(7.5).fillColor(C.headerSub)
    .text(`Generado: ${generatedAt}`, rightX, 40, { width: rightW, align: 'right' })
  doc.font('Helvetica').fontSize(7.5).fillColor(C.headerSub)
    .text(`${totalRecords} registro${totalRecords !== 1 ? 's' : ''}`, rightX, 52, { width: rightW, align: 'right' })

  // ── Bottom accent + PoweredBy ───────────────────────────────
  doc.rect(0, HEADER_H - 2, PAGE_W, 3).fill(C.accent)

  // Thin "Powered by AutoSys" text on the accent line
  doc.font('Helvetica').fontSize(6.5).fillColor('rgba(255,255,255,0.7)')
    .text('Powered by AutoSys', 0, HEADER_H - 11, { width: PAGE_W, align: 'center' })
}

/** Slim header on continuation pages */
function drawContinuationHeader(
  doc: InstanceType<typeof PDFDocument>,
  reportTitle: string,
  empresa?: EmpresaInfo
) {
  doc.rect(0, 0, PAGE_W, 4).fill(C.accent)
  doc.rect(0, 4, PAGE_W, 28).fill(C.accentDark)

  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.white)
    .text(empresa?.nombre ?? 'AutoSys', MARGIN, 13)

  doc.font('Helvetica').fontSize(9).fillColor(C.headerSub)
    .text(reportTitle, MARGIN, 13, { width: TABLE_W, align: 'right' })

  doc.rect(0, 32, PAGE_W, 2).fill(C.accent)
}

/** Footer with exact page numbers */
function drawFooter(
  doc: InstanceType<typeof PDFDocument>,
  pageNum: number,
  totalPages: number
) {
  doc.rect(MARGIN, CONTENT_BOTTOM + 4, TABLE_W, 0.5).fill(C.divider)
  doc.font('Helvetica').fontSize(7.5).fillColor(C.subtle)
    .text('AutoSys © ' + new Date().getFullYear(), MARGIN, CONTENT_BOTTOM + 10, { width: TABLE_W / 2 })
    .text(`Página ${pageNum} de ${totalPages}`, MARGIN, CONTENT_BOTTOM + 10, { width: TABLE_W, align: 'right' })
}

// ─── Table rendering ──────────────────────────────────────────────────────────

const COL_H = 26
const ROW_H = 20

function drawColHeader(
  doc: InstanceType<typeof PDFDocument>,
  cols: (TableColumn & { width: number })[],
  y: number
) {
  doc.rect(MARGIN, y, TABLE_W, COL_H).fill(C.accent)
  let x = MARGIN
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.white)
  cols.forEach((col) => {
    doc.text(col.header.toUpperCase(), x + 5, y + 9, {
      width: col.width - 10,
      align: col.align ?? 'left',
      lineBreak: false,
    })
    x += col.width
  })
  // Vertical separators inside header
  x = MARGIN
  cols.slice(0, -1).forEach((col) => {
    x += col.width
    doc.rect(x, y + 5, 0.5, COL_H - 10).fill('rgba(255,255,255,0.3)')
  })
  return y + COL_H
}

function drawRows(
  doc: InstanceType<typeof PDFDocument>,
  cols: (TableColumn & { width: number })[],
  data: any[],
  startY: number,
  reportTitle: string,
  empresa?: EmpresaInfo
): number {
  let y = startY
  let tableStartY = startY - COL_H
  const contTopY = 38  // where table starts on continuation pages

  data.forEach((row, idx) => {
    if (y + ROW_H > CONTENT_BOTTOM) {
      // Close border on current page
      doc.rect(MARGIN, tableStartY, TABLE_W, y - tableStartY).stroke(C.accentBorder)
      doc.addPage()
      drawContinuationHeader(doc, reportTitle, empresa)
      y = contTopY
      y = drawColHeader(doc, cols, y)
      tableStartY = y - COL_H
    }

    if (idx % 2 === 0) {
      doc.rect(MARGIN, y, TABLE_W, ROW_H).fill(C.accentLight)
    }

    doc.rect(MARGIN, y + ROW_H - 0.5, TABLE_W, 0.5).fill(C.divider)

    let x = MARGIN
    doc.font('Helvetica').fontSize(9).fillColor(C.text)
    cols.forEach((col) => {
      doc.text(fmtValue(row[col.key], col.format), x + 5, y + 5, {
        width: col.width - 10,
        align: col.align ?? 'left',
        lineBreak: false,
      })
      x += col.width
    })

    x = MARGIN
    cols.slice(0, -1).forEach((col) => {
      x += col.width
      doc.rect(x, y, 0.5, ROW_H).fill(C.divider)
    })

    y += ROW_H
  })

  doc.rect(MARGIN, tableStartY, TABLE_W, y - tableStartY).stroke(C.accentBorder)
  return y
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generatePDFReport(
  data: any[],
  reportTitle: string,
  columns: TableColumn[],
  empresa?: EmpresaInfo
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true })
      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const cols = resolveWidths(columns)
      const generatedAt = new Date().toLocaleString('es-VE')

      // Page 1
      drawMainHeader(doc, reportTitle, data.length, generatedAt, empresa)

      if (data.length === 0) {
        doc.font('Helvetica').fontSize(11).fillColor(C.muted)
          .text('No hay datos disponibles para este reporte.', MARGIN, CONTENT_TOP + 20, {
            width: TABLE_W,
            align: 'center',
          })
      } else {
        let y = drawColHeader(doc, cols, CONTENT_TOP)
        drawRows(doc, cols, data, y, reportTitle, empresa)
      }

      // Footers (exact page count via bufferPages)
      const range = doc.bufferedPageRange()
      const totalPages = range.count
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i)
        drawFooter(doc, i + 1, totalPages)
      }

      doc.flushPages()
      doc.end()
    } catch (error) {
      console.error('Error generating PDF:', error)
      reject(error)
    }
  })
}

// ─── Legacy named exports ─────────────────────────────────────────────────────

export async function generateLowStockPDF(items: any[], empresa?: EmpresaInfo): Promise<Buffer> {
  return generatePDFReport(items, 'Reporte de Stock Bajo', [
    { header: 'Artículo', key: 'itemName' },
    { header: 'SKU', key: 'itemSKU', width: 80, align: 'center' },
    { header: 'Stock Actual', key: 'currentStock', width: 80, align: 'right', format: 'number' },
    { header: 'Stock Mínimo', key: 'minimumStock', width: 80, align: 'right', format: 'number' },
    { header: 'Almacén', key: 'warehouseName', width: 100 },
  ], empresa)
}

export async function generateDeadStockPDF(items: any[], empresa?: EmpresaInfo): Promise<Buffer> {
  return generatePDFReport(items, 'Reporte de Stock Muerto', [
    { header: 'Artículo', key: 'itemName' },
    { header: 'SKU', key: 'itemSKU', width: 80, align: 'center' },
    { header: 'Stock', key: 'currentStock', width: 60, align: 'right', format: 'number' },
    { header: 'Días Sin Movimiento', key: 'daysInactive', width: 110, align: 'right', format: 'number' },
    { header: 'Almacén', key: 'warehouseName', width: 100 },
  ], empresa)
}

export async function generateStockValuePDF(items: any[], empresa?: EmpresaInfo): Promise<Buffer> {
  return generatePDFReport(items, 'Valoración de Stock', [
    { header: 'Artículo', key: 'itemName' },
    { header: 'SKU', key: 'itemSKU', width: 75, align: 'center' },
    { header: 'Cantidad', key: 'quantity', width: 65, align: 'right', format: 'number' },
    { header: 'Precio Unit.', key: 'unitPrice', width: 80, align: 'right', format: 'currency' },
    { header: 'Valor Total', key: 'totalValue', width: 85, align: 'right', format: 'currency' },
    { header: 'Almacén', key: 'warehouseName', width: 90 },
  ], empresa)
}

export async function generateMovementReportPDF(movements: any[], empresa?: EmpresaInfo): Promise<Buffer> {
  return generatePDFReport(movements, 'Reporte de Movimientos', [
    { header: 'Fecha', key: 'movementDate', width: 80, format: 'date' },
    { header: 'Artículo', key: 'itemName' },
    { header: 'Tipo', key: 'type', width: 70, align: 'center' },
    { header: 'Cantidad', key: 'quantity', width: 65, align: 'right', format: 'number' },
    { header: 'Almacén', key: 'warehouseName', width: 90 },
  ], empresa)
}

export async function generateABCAnalysisPDF(items: any[], empresa?: EmpresaInfo): Promise<Buffer> {
  return generatePDFReport(items, 'Análisis ABC', [
    { header: 'Artículo', key: 'itemName' },
    { header: 'SKU', key: 'itemSKU', width: 75, align: 'center' },
    { header: 'Valor Total', key: 'totalMovementValue', width: 85, align: 'right', format: 'currency' },
    { header: '% del Total', key: 'percentageOfTotal', width: 65, align: 'right', format: 'percent' },
    { header: '% Acumulado', key: 'cumulativePercentage', width: 75, align: 'right', format: 'percent' },
    { header: 'Clase', key: 'classification', width: 50, align: 'center' },
  ], empresa)
}

export async function generateTurnoverPDF(items: any[], empresa?: EmpresaInfo): Promise<Buffer> {
  return generatePDFReport(items, 'Análisis de Rotación', [
    { header: 'Artículo', key: 'itemName' },
    { header: 'SKU', key: 'itemSKU', width: 75, align: 'center' },
    { header: 'Rotación', key: 'turnoverRatio', width: 65, align: 'right', format: 'number' },
    { header: 'DIO', key: 'daysInventoryOutstanding', width: 55, align: 'right', format: 'number' },
    { header: 'Salud', key: 'healthScore', width: 55, align: 'right' },
    { header: 'Clase', key: 'classification', width: 65, align: 'center' },
  ], empresa)
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
