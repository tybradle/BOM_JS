import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { format = 'EPLAN' } = body // Default to EPLAN format

    // Get project details with locations and items
    const project = await db.bOMProject.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            items: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    let content = ''
    let filename = ''
    let contentType = 'application/json'
    let zw1Content: string | null = null
    let zw1Filename: string | null = null

    if (format === 'EPLAN' || format === 'XML') {
      content = generateEplanXML(project)
      const baseName = `${project.projectNumber}_${project.packageName.replace(/[^a-zA-Z0-9]/g, '_')}`
      filename = `${baseName}.xml`
      contentType = 'application/xml'
      
      // Generate .zw1 backup file for Eplan
      zw1Content = generateEplanZW1()
      zw1Filename = `${baseName}.zw1`
    } else if (format === 'EXCEL') {
      // Generate Excel file
      const excelBuffer = generateExcelFile(project)
      // Convert buffer to base64 for storage
      content = excelBuffer.toString('base64')
      filename = `${project.projectNumber}_${project.packageName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (format === 'JSON') {
      content = JSON.stringify(project, null, 2)
      filename = `${project.projectNumber}_BOM.json`
      contentType = 'application/json'
    } else if (format === 'CSV') {
      content = generateCSV(project)
      filename = `${project.projectNumber}_${project.packageName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
      contentType = 'text/csv'
    } else {
      return NextResponse.json(
        { error: 'Unsupported export format' },
        { status: 400 }
      )
    }

    // Save export record
    const exportRecord = await db.bOMExport.create({
      data: {
        filename,
        format: format.toUpperCase() === 'XML' ? 'EPLAN' : format.toUpperCase(),
        content,
        version: project.version,
        projectId: id
      }
    })

    return NextResponse.json({
      id: exportRecord.id,
      filename,
      content,
      contentType,
      format: format.toUpperCase(),
      exportedAt: exportRecord.exportedAt,
      // Include .zw1 file for Eplan exports
      zw1Content,
      zw1Filename
    })
  } catch (error) {
    console.error('Failed to export BOM:', error)
    return NextResponse.json(
      { error: 'Failed to export BOM' },
      { status: 500 }
    )
  }
}

function generateEplanXML(project: any): string {
  // Eplan XML format based on sample: 14247_Z2_MAIN_1.xml
  // Project → Package → KittingLocation(s) → Parts
  
  // Project name format: {projectNumber}_{packageName} (NO version)
  const projectName = `${project.projectNumber}_${project.packageName}`
  
  const xmlHeader = `<?xml version="1.0" encoding="utf-8"?>
<Project Name="${escapeXml(projectName)}">`

  const packageXML = `
  <Package Name="${escapeXml(project.packageName)}">`

  // Generate KittingLocation elements for each location with items
  const locationsXML = project.locations
    .filter((location: any) => location.items && location.items.length > 0)
    .map((location: any) => {
      const locationName = location.exportName || location.name
      const partsXML = location.items.map((item: any) => generatePartXML(item)).join('\n')
      
      return `    <KittingLocation Name="${escapeXml(locationName)}">
${partsXML}
    </KittingLocation>`
    }).join('\n')

  const xmlFooter = `
  </Package>
</Project>`

  return xmlHeader + packageXML + '\n' + locationsXML + xmlFooter
}

function generatePartXML(item: any): string {
  // Map BOMItem fields to Eplan P_ARTICLE fields
  return `      <Part>
        <P_ARTICLE_MANUFACTURER>${escapeXml(item.manufacturer || '')}</P_ARTICLE_MANUFACTURER>
        <P_ARTICLE_DESCR1>${escapeXml(item.description)}</P_ARTICLE_DESCR1>
        <P_ARTICLE_DESCR2>${escapeXml(item.secondaryDescription || item.category || '')}</P_ARTICLE_DESCR2>
        <P_ARTICLE_ORDERNR>${escapeXml(item.partNumber)}</P_ARTICLE_ORDERNR>
        <P_ARTICLE_DEVTAG>${escapeXml(item.referenceDesignator || '')}</P_ARTICLE_DEVTAG>
        <P_ARTICLE_QUANTITY_IN_PROJECT_UNIT>${item.quantity}</P_ARTICLE_QUANTITY_IN_PROJECT_UNIT>
        <P_ARTICLE_SALESPRICE_1>${item.unitPrice !== null && item.unitPrice !== undefined ? item.unitPrice : ''}</P_ARTICLE_SALESPRICE_1>
        <P_ARTICLE_SPARE>${item.isSpare ? '1' : '0'}</P_ARTICLE_SPARE>
      </Part>`
}

function escapeXml(str: string): string {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generateEplanZW1(): string {
  // Generate a minimal .zw1 file to mimic an Eplan backup
  // The .zw1 file is typically a small header/metadata file that accompanies the XML
  // This contains a few bytes of data that Eplan uses to identify the backup
  
  // Eplan .zw1 files typically contain a small header with version info
  // Using a minimal valid structure
  const zw1Header = Buffer.from([
    0x45, 0x50, 0x4C, 0x41, 0x4E,  // "EPLAN" in ASCII
    0x00,                           // Null terminator
    0x01, 0x00,                     // Version bytes
    0x00, 0x00, 0x00, 0x00,        // Reserved/padding
    0xFF, 0xFF                      // End marker
  ])
  
  return zw1Header.toString('base64')
}

function generateCSV(project: any): string {
  // Flatten all items from all locations with location info
  const rows: any[] = []
  
  project.locations.forEach((location: any) => {
    location.items.forEach((item: any) => {
      rows.push({
        location: location.exportName || location.name,
        partNumber: item.partNumber,
        manufacturer: item.manufacturer || '',
        description: item.description,
        secondaryDescription: item.secondaryDescription || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice !== null && item.unitPrice !== undefined ? item.unitPrice : '',
        category: item.category || '',
        status: item.status,
        isSpare: item.isSpare ? 'Yes' : 'No',
        referenceDesignator: item.referenceDesignator || '',
        supplier: item.supplier || ''
      })
    })
  })

  if (rows.length === 0) {
    return 'Location,Part Number,Manufacturer,Description,Description 2,Quantity,Unit Price,Category,Status,Spare,Reference,Supplier\n'
  }

  const headers = [
    'Location',
    'Part Number',
    'Manufacturer',
    'Description',
    'Description 2',
    'Quantity',
    'Unit Price',
    'Category',
    'Status',
    'Spare',
    'Reference',
    'Supplier'
  ]

  const csvContent = [
    headers.join(','),
    ...rows.map(row => [
      escapeCSV(row.location),
      escapeCSV(row.partNumber),
      escapeCSV(row.manufacturer),
      escapeCSV(row.description),
      escapeCSV(row.secondaryDescription),
      row.quantity,
      row.unitPrice,
      escapeCSV(row.category),
      row.status,
      row.isSpare,
      escapeCSV(row.referenceDesignator),
      escapeCSV(row.supplier)
    ].join(','))
  ].join('\n')

  return csvContent
}

function escapeCSV(str: string): string {
  if (typeof str !== 'string') return ''
  // If the string contains comma, quote, or newline, wrap it in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function generateExcelFile(project: any): Buffer {
  const workbook = XLSX.utils.book_new()

  // Create a sheet for each location
  project.locations.forEach((location: any) => {
    if (location.items && location.items.length > 0) {
      const sheetData: any[] = []

      // Headers
      sheetData.push([
        'Part Number',
        'Manufacturer',
        'Description',
        'Description 2',
        'Quantity',
        'Unit Price',
        'Category',
        'Status',
        'Spare',
        'Reference',
        'Supplier'
      ])

      // Data rows
      location.items.forEach((item: any) => {
        sheetData.push([
          item.partNumber,
          item.manufacturer || '',
          item.description,
          item.secondaryDescription || '',
          item.quantity,
          item.unitPrice !== null && item.unitPrice !== undefined ? Number(item.unitPrice) : '',
          item.category || '',
          item.status,
          item.isSpare ? 'Yes' : 'No',
          item.referenceDesignator || '',
          item.supplier || ''
        ])
      })

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 }, // Part Number
        { wch: 15 }, // Manufacturer
        { wch: 40 }, // Description
        { wch: 30 }, // Description 2
        { wch: 10 }, // Quantity
        { wch: 12 }, // Unit Price
        { wch: 15 }, // Category
        { wch: 10 }, // Status
        { wch: 8 },  // Spare
        { wch: 15 }, // Reference
        { wch: 15 }  // Supplier
      ]

      // Sanitize sheet name (max 31 chars, no special chars)
      const sheetName = (location.exportName || location.name)
        .replace(/[:\\/?*\[\]]/g, '')
        .substring(0, 31)

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    }
  })

  // If no sheets were created, add an empty summary sheet
  if (workbook.SheetNames.length === 0) {
    const emptySheet = XLSX.utils.aoa_to_sheet([['No items to export']])
    XLSX.utils.book_append_sheet(workbook, emptySheet, 'Summary')
  }

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return excelBuffer
}