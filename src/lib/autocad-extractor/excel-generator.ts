// Excel generation utilities
import ExcelJS from 'exceljs'
import type { BOMItem } from './types'

// Generate Excel workbook from BOM items
export const generateExcelWorkbook = async (
  items: BOMItem[],
  fileName: string
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(fileName)

  // Define columns
  worksheet.columns = [
    { header: '#', key: 'itemNumber', width: 8 },
    { header: 'Part Number', key: 'partNumber', width: 20 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Manufacturer', key: 'manufacturer', width: 20 },
    { header: 'Qty', key: 'quantity', width: 10 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Review', key: 'flagged', width: 10 }
  ]

  // Style header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  // Add data rows
  items.forEach((item) => {
    const row = worksheet.addRow({
      itemNumber: item.itemNumber,
      partNumber: item.partNumber,
      description: item.description,
      manufacturer: item.manufacturer,
      quantity: item.quantity,
      confidence: item.confidence ? `${Math.round(item.confidence * 100)}%` : 'N/A',
      flagged: item.flagged ? 'REVIEW' : 'OK'
    })

    // Highlight flagged rows
    if (item.flagged) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC7CE' }
      }
      row.font = { color: { argb: 'FF9C0006' } }
    }

    // Format confidence cell
    const confidenceCell = row.getCell('confidence')
    if (item.confidence && item.confidence < 0.8) {
      confidenceCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEB9C' }
      }
    }
  })

  // Auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: `G${items.length + 1}`
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Generate Excel from multiple sheets (for multi-file processing)
export const generateMultiSheetWorkbook = async (
  fileData: Array<{ fileName: string; items: BOMItem[] }>
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook()

  for (const { fileName, items } of fileData) {
    const worksheet = workbook.addWorksheet(sanitizeSheetName(fileName))

    // Define columns
    worksheet.columns = [
      { header: '#', key: 'itemNumber', width: 8 },
      { header: 'Part Number', key: 'partNumber', width: 20 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Manufacturer', key: 'manufacturer', width: 20 },
      { header: 'Qty', key: 'quantity', width: 10 },
      { header: 'Confidence', key: 'confidence', width: 12 },
      { header: 'Review', key: 'flagged', width: 10 }
    ]

    // Style header
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }

    // Add data
    items.forEach((item) => {
      const row = worksheet.addRow({
        itemNumber: item.itemNumber,
        partNumber: item.partNumber,
        description: item.description,
        manufacturer: item.manufacturer,
        quantity: item.quantity,
        confidence: item.confidence ? `${Math.round(item.confidence * 100)}%` : 'N/A',
        flagged: item.flagged ? 'REVIEW' : 'OK'
      })

      if (item.flagged) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' }
        }
      }
    })

    worksheet.autoFilter = {
      from: 'A1',
      to: `G${items.length + 1}`
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Sanitize sheet name (Excel has restrictions)
const sanitizeSheetName = (name: string): string => {
  return name
    .replace(/[:\\\/\?\*\[\]]/g, '_') // Remove invalid characters
    .substring(0, 31) // Max 31 characters
}
