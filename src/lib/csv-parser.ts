/**
 * CSV/Excel Parser for Clean Master Parts Data
 * 
 * Parses cleaned master parts exports from SharePoint/Excel
 * Replaces the legacy Eplan XML parser with a simpler, cleaner approach
 */

import { parse } from 'csv-parse'
import ExcelJS from 'exceljs'
import { readFileSync } from 'fs'

// Debug mode - only enabled in development
const DEBUG = process.env.NODE_ENV !== 'production'

/**
 * Clean part data structure
 * Required fields: partNumber, manufacturer, description
 * Optional fields: category, unitPrice, currency, secondaryDescription
 */
export interface CleanPartData {
  partNumber: string
  manufacturer: string
  description: string
  category?: string
  unitPrice?: number
  currency?: string
  secondaryDescription?: string
}

/**
 * Parse result with validation errors
 */
export interface ParseResult {
  parts: CleanPartData[]
  totalRows: number
  validRows: number
  skippedRows: number
  errors: Array<{
    row: number
    field?: string
    error: string
    data?: Record<string, unknown>
  }>
}

/**
 * Parse a CSV file with master parts data
 * 
 * Supports flexible column names:
 * - Part Number: "Part Numbers", "Part Number", "PartNumber", "partNumber"
 * - Manufacturer: "Manufacturer", "Mfr", "Vendor"
 * - Description: "Description", "Desc", "Part Description"
 * - Unit Cost: "Unit Cost", "Unit Price", "Price", "Cost"
 * - Currency: "Currency", "Curr"
 * 
 * @param filePath - Path to CSV file
 * @returns ParseResult with parts and validation errors
 */
export async function parsePartsCSV(filePath: string): Promise<ParseResult> {
  const fileContent = readFileSync(filePath, 'utf-8')
  
  const errors: ParseResult['errors'] = []
  const validParts: CleanPartData[] = []
  
  try {
    // Parse CSV with flexible options using promise wrapper
    const records = await new Promise<Record<string, string>[]>((resolve, reject) => {
      parse(fileContent, {
        columns: true, // Use first row as headers
        skip_empty_lines: true,
        trim: true,
        bom: true, // Handle UTF-8 BOM
        relax_column_count: true, // Allow variable column counts
        cast: false, // Keep everything as strings for manual parsing
      }, (err, records) => {
        if (err) {
          reject(err)
        } else {
          resolve(records as Record<string, string>[])
        }
      })
    })
    
    if (DEBUG) console.log(`Parsed ${records.length} rows from CSV`)
    
    // Process each row
    records.forEach((record, index) => {
      const rowNumber = index + 2 // +2 because index is 0-based and row 1 is headers
      
      try {
        const part = parsePartRecord(record, rowNumber)
        if (part) {
          validParts.push(part)
        } else {
          errors.push({
            row: rowNumber,
            error: 'Row skipped - missing required fields',
            data: record
          })
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: record
        })
      }
    })
    
    return {
      parts: validParts,
      totalRows: records.length,
      validRows: validParts.length,
      skippedRows: records.length - validParts.length,
      errors
    }
    
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse an Excel file with master parts data
 * 
 * @param filePath - Path to Excel file (.xlsx or .xls)
 * @param sheetName - Optional sheet name (uses first sheet if not specified)
 * @returns ParseResult with parts and validation errors
 */
export async function parsePartsExcel(filePath: string, sheetName?: string): Promise<ParseResult> {
  const errors: ParseResult['errors'] = []
  const validParts: CleanPartData[] = []
  
  try {
    // Read workbook
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)
    
    // Get worksheet
    const worksheet = sheetName 
      ? workbook.getWorksheet(sheetName)
      : workbook.worksheets[0]
    
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName || workbook.worksheets[0]?.name}" not found`)
    }
    
    // Get headers from first row
    const headers: string[] = []
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || ''
    })
    
    // Convert to JSON
    const records: Record<string, string>[] = []
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Skip header row
      
      const record: Record<string, string> = {}
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1]
        if (header) {
          record[header] = cell.value?.toString() || ''
        }
      })
      records.push(record)
    })
    
    if (DEBUG) console.log(`Parsed ${records.length} rows from Excel`)
    
    // Process each row
    records.forEach((record, index) => {
      const rowNumber = index + 2 // +2 because index is 0-based and row 1 is headers
      
      try {
        const part = parsePartRecord(record, rowNumber)
        if (part) {
          validParts.push(part)
        } else {
          errors.push({
            row: rowNumber,
            error: 'Row skipped - missing required fields',
            data: record
          })
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: record
        })
      }
    })
    
    return {
      parts: validParts,
      totalRows: records.length,
      validRows: validParts.length,
      skippedRows: records.length - validParts.length,
      errors
    }
    
  } catch (error) {
    throw new Error(`Failed to parse Excel: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse a single record (row) into CleanPartData
 * 
 * Handles flexible column names and data normalization
 */
function parsePartRecord(record: Record<string, string>, rowNumber: number): CleanPartData | null {
  // Debug logging
  if (DEBUG) {
    console.log(`\n=== Processing Row ${rowNumber} ===`)
    console.log('Available columns:', Object.keys(record))
    console.log('Record data:', record)
  }
  
  // Find part number (flexible column names)
  const partNumber = findValue(record, [
    'Part Numbers', 'Part Number', 'PartNumber', 'partNumber', 'Part_Number', 'PART_NUMBER'
  ])
  
  // Find manufacturer
  const manufacturer = findValue(record, [
    'Manufacturer', 'Mfr', 'Vendor', 'MANUFACTURER', 'MFR'
  ])
  
  // Find description
  const description = findValue(record, [
    'Description', 'Desc', 'Part Description', 'DESCRIPTION', 'DESC'
  ])
  
  if (DEBUG) console.log(`Extracted values - Part: "${partNumber}", Mfr: "${manufacturer}", Desc: "${description}"`)
  
  // Validate required fields
  if (!partNumber || !manufacturer || !description) {
    if (DEBUG) console.log(`Row ${rowNumber} INVALID - Missing required fields`)
    return null
  }
  
  // Parse optional fields
  const category = findValue(record, [
    'Category', 'Type', 'Part Type', 'CATEGORY'
  ])
  
  const unitPriceStr = findValue(record, [
    'Unit Cost', 'Unit Price', 'Price', 'Cost', 'UnitPrice', 'UNIT_COST'
  ])
  
  const currency = findValue(record, [
    'Currency', 'Curr', 'CURRENCY'
  ])
  
  const secondaryDescription = findValue(record, [
    'Secondary Description', 'Description 2', 'Desc2', 'Notes'
  ])
  
  // Parse unit price (remove commas, currency symbols)
  let unitPrice: number | undefined
  if (unitPriceStr) {
    const cleanPrice = unitPriceStr.replace(/[,$]/g, '').trim()
    const parsed = parseFloat(cleanPrice)
    if (!isNaN(parsed) && parsed >= 0) {
      unitPrice = parsed
    }
  }
  
  return {
    partNumber: partNumber.trim(),
    manufacturer: manufacturer.trim(),
    description: description.trim(),
    category: category?.trim() || undefined,
    unitPrice,
    currency: currency?.trim().toUpperCase() || undefined,
    secondaryDescription: secondaryDescription?.trim() || undefined,
  }
}

/**
 * Find a value in a record by trying multiple possible column names
 */
function findValue(record: Record<string, string>, possibleNames: string[]): string | undefined {
  if (DEBUG) console.log(`Searching for values with possible names:`, possibleNames)
  
  for (const name of possibleNames) {
    // Try exact match
    if (record[name] !== undefined && record[name] !== '') {
      if (DEBUG) console.log(`Found exact match for "${name}": "${record[name]}"`)
      return record[name]
    }
    
    // Try case-insensitive match
    const lowerName = name.toLowerCase()
    for (const key in record) {
      if (key.toLowerCase() === lowerName && record[key] !== '') {
        if (DEBUG) console.log(`Found case-insensitive match: "${key}" -> "${record[key]}"`)
        return record[key]
      }
    }
  }
  
  if (DEBUG) console.log(`No value found for any of the possible names`)
  return undefined
}

/**
 * Validate that required columns exist in the CSV/Excel file
 */
export function validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
  const requiredFields = [
    { field: 'Part Number', variants: ['Part Numbers', 'Part Number', 'PartNumber', 'partNumber'] },
    { field: 'Manufacturer', variants: ['Manufacturer', 'Mfr', 'Vendor'] },
    { field: 'Description', variants: ['Description', 'Desc', 'Part Description'] }
  ]
  
  const missing: string[] = []
  
  for (const required of requiredFields) {
    const found = required.variants.some(variant =>
      headers.some(header => header.toLowerCase() === variant.toLowerCase())
    )
    
    if (!found) {
      missing.push(required.field)
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  }
}
