import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

// Configure route to handle file uploads
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error('FormData parse error:', error)
      return NextResponse.json(
        { error: 'Failed to parse form data. Please ensure you are uploading a valid file.' },
        { status: 400 }
      )
    }
    
    const file = formData.get('file') as File
    const locationId = formData.get('locationId') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await db.bOMProject.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify location exists and belongs to project
    const location = await db.location.findFirst({
      where: {
        id: locationId,
        projectId
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found or does not belong to this project' },
        { status: 404 }
      )
    }

    // Parse file based on type
    const fileBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)
    const fileName = file.name.toLowerCase()
    
    console.log('Parsing file:', fileName, 'Size:', uint8Array.length, 'bytes')
    
    let rows: any[] = []

    if (fileName.endsWith('.csv')) {
      console.log('Parsing as CSV...')
      // Parse CSV
      const text = new TextDecoder().decode(uint8Array)
      const parseResult = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim()
      })
      rows = parseResult.data
      console.log('CSV parsed, rows:', rows.length)
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      console.log('Parsing as Excel...')
      // Parse Excel
      const workbook = XLSX.read(uint8Array, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
      console.log('Excel parsed, rows:', rows.length)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload CSV or Excel (.xlsx) file' },
        { status: 400 }
      )
    }

    // Validate and transform rows
    const validRows: any[] = []
    const errors: Array<{ row: number; errors: string[] }> = []

    console.log('Validating rows...')
    
    rows.forEach((row, index) => {
      const rowErrors: string[] = []
      const rowNumber = index + 2 // Account for header row

      // Map columns to BOM fields (case-insensitive)
      const mappedRow = mapColumnsToFields(row)

      // Convert values to strings and validate required fields
      const partNumber = String(mappedRow.partNumber || '').trim()
      const description = String(mappedRow.description || '').trim()
      const quantity = mappedRow.quantity
      
      if (!partNumber) {
        rowErrors.push('Part number is required')
      }
      if (!description) {
        rowErrors.push('Description is required')
      }
      if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
        rowErrors.push('Quantity must be a positive number')
      }

      // Validate optional number fields
      if (mappedRow.unitPrice && mappedRow.unitPrice !== '' && isNaN(Number(mappedRow.unitPrice))) {
        rowErrors.push('Unit price must be a valid number')
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNumber, errors: rowErrors })
      } else {
        validRows.push({
          partNumber,
          description,
          secondaryDescription: mappedRow.secondaryDescription ? String(mappedRow.secondaryDescription).trim() : null,
          quantity: Number(quantity),
          unit: mappedRow.unit ? String(mappedRow.unit).trim() : 'EA', // Default to 'EA' (Each) if not provided
          unitPrice: mappedRow.unitPrice && mappedRow.unitPrice !== '' ? Number(mappedRow.unitPrice) : null,
          manufacturer: mappedRow.manufacturer ? String(mappedRow.manufacturer).trim() : null,
          supplier: mappedRow.supplier ? String(mappedRow.supplier).trim() : null,
          category: mappedRow.category ? String(mappedRow.category).trim() : null,
          referenceDesignator: mappedRow.referenceDesignator ? String(mappedRow.referenceDesignator).trim() : null,
          status: validateStatus(mappedRow.status),
          isSpare: parseBoolean(mappedRow.isSpare),
          projectId,
          locationId
        })
      }
    })

    console.log('Validation complete. Valid:', validRows.length, 'Invalid:', errors.length)

    // Import valid rows in batches
    let imported = 0
    const batchSize = 100

    console.log('Starting batch import...')

    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize)
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}, items: ${batch.length}`)
      
      // Get the current max order for this location
      const maxOrderItem = await db.bOMItem.findFirst({
        where: { locationId },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      
      const startOrder = (maxOrderItem?.order || 0) + 1

      // Add order to each item
      const itemsWithOrder = batch.map((item, idx) => ({
        ...item,
        order: startOrder + idx
      }))

      await db.bOMItem.createMany({
        data: itemsWithOrder
      })

      imported += batch.length
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rows.length,
        imported,
        skipped: errors.length,
        errors: errors.map(e => ({
          row: e.row,
          error: e.errors.join(', ')
        }))
      }
    })

  } catch (error) {
    console.error('Import error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { 
        error: 'Failed to import BOM items', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Map various column names to standard BOM fields
function mapColumnsToFields(row: any): any {
  const mapped: any = {}

  // Part Number variations
  const partNumberKeys = ['part number', 'partnumber', 'part#', 'p/n', 'part_number', 'item number', 'itemnumber']
  mapped.partNumber = findValueByKeys(row, partNumberKeys)

  // Description variations
  const descriptionKeys = ['description', 'desc', 'name', 'part name', 'partname']
  mapped.description = findValueByKeys(row, descriptionKeys)

  // Secondary Description variations
  const secondaryDescKeys = ['description 2', 'description2', 'desc2', 'secondary description', 'secondarydescription']
  mapped.secondaryDescription = findValueByKeys(row, secondaryDescKeys)

  // Quantity variations
  const quantityKeys = ['quantity', 'qty', 'count', 'amount']
  mapped.quantity = findValueByKeys(row, quantityKeys)

  // Unit variations
  const unitKeys = ['unit', 'uom', 'unit of measure', 'unitofmeasure', 'u/m']
  mapped.unit = findValueByKeys(row, unitKeys)

  // Unit Price variations
  const priceKeys = ['unit price', 'unitprice', 'price', 'cost', 'unit cost', 'unitcost']
  mapped.unitPrice = findValueByKeys(row, priceKeys)

  // Manufacturer variations
  const manufacturerKeys = ['manufacturer', 'mfr', 'vendor', 'make']
  mapped.manufacturer = findValueByKeys(row, manufacturerKeys)

  // Supplier variations
  const supplierKeys = ['supplier', 'distributor', 'source']
  mapped.supplier = findValueByKeys(row, supplierKeys)

  // Category variations
  const categoryKeys = ['category', 'type', 'class', 'classification']
  mapped.category = findValueByKeys(row, categoryKeys)

  // Reference Designator variations
  const referenceKeys = ['reference', 'ref', 'tag', 'reference designator', 'referencedesignator', 'device tag']
  mapped.referenceDesignator = findValueByKeys(row, referenceKeys)

  // Status variations
  const statusKeys = ['status', 'state']
  mapped.status = findValueByKeys(row, statusKeys)

  // Spare variations
  const spareKeys = ['spare', 'is spare', 'isspare', 'spare part', 'sparepart']
  mapped.isSpare = findValueByKeys(row, spareKeys)

  return mapped
}

function findValueByKeys(row: any, keys: string[]): any {
  for (const key of keys) {
    // Check exact match (case-insensitive)
    const foundKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase())
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
      return row[foundKey]
    }
  }
  return ''
}

function validateStatus(status: any): string {
  if (!status) return 'ACTIVE'
  
  const statusUpper = String(status).toUpperCase()
  const validStatuses = ['ACTIVE', 'OBSOLETE', 'PENDING', 'DISCONTINUED']
  
  return validStatuses.includes(statusUpper) ? statusUpper : 'ACTIVE'
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (!value) return false
  
  const str = String(value).toLowerCase().trim()
  return str === 'true' || str === 'yes' || str === '1' || str === 'y'
}
