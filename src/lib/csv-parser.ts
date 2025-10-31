/**
 * CSV/Excel Parser for Clean Master Parts Data
 * 
 * Parses cleaned master parts exports from SharePoint/Excel
 * Replaces the legacy Eplan XML parser with a simpler, cleaner approach
 */

import { parse } from 'csv-parse/sync'
import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

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
export function parsePartsCSV(filePath: string): ParseResult {
  const fileContent = readFileSync(filePath, 'utf-8')
  
  const errors: ParseResult['errors'] = []
  const validParts: CleanPartData[] = []
  
  try {
    // Parse CSV with flexible options
    const records = parse(fileContent, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle UTF-8 BOM
      relaxColumnCount: true, // Allow variable column counts
      cast: false, // Keep everything as strings for manual parsing
    }) as Record<string, string>[]
    
    console.log(`Parsed ${records.length} rows from CSV`)
    
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
export function parsePartsExcel(filePath: string, sheetName?: string): ParseResult {
  const errors: ParseResult['errors'] = []
  const validParts: CleanPartData[] = []
  
  try {
    // Read workbook
    const workbook = XLSX.readFile(filePath)
    
    // Get sheet name
    const sheet = sheetName 
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]]
    
    if (!sheet) {
      throw new Error(`Sheet "${sheetName || workbook.SheetNames[0]}" not found`)
    }
    
    // Convert to JSON
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '', // Default empty cells to empty string
      raw: false, // Convert everything to strings
    })
    
    console.log(`Parsed ${records.length} rows from Excel`)
    
    // Process each row
    records.forEach((record, index) => {
      const rowNumber = index + 2 // +2 because index is 0-based and row 1 is headers
      
      try {
        // Convert all values to strings
        const stringRecord: Record<string, string> = {}
        Object.entries(record).forEach(([key, value]) => {
          stringRecord[key] = String(value || '')
        })
        
        const part = parsePartRecord(stringRecord, rowNumber)
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
  
  // Validate required fields
  if (!partNumber || !manufacturer || !description) {
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
  for (const name of possibleNames) {
    // Try exact match
    if (record[name] !== undefined && record[name] !== '') {
      return record[name]
    }
    
    // Try case-insensitive match
    const lowerName = name.toLowerCase()
    for (const key in record) {
      if (key.toLowerCase() === lowerName && record[key] !== '') {
        return record[key]
      }
    }
  }
  
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
