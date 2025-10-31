import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { clearSearchCache } from '@/lib/search-cache'
import { parsePartsCSV, parsePartsExcel } from '@/lib/csv-parser'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/parts/import
 * 
 * Import parts from uploaded file
 * 
 * Supported formats:
 * 1. CSV (.csv) - RECOMMENDED: Clean master parts data from SharePoint
 * 2. Excel (.xlsx, .xls) - RECOMMENDED: Clean master parts data from SharePoint
 * 
 * Note: XML support removed - use CSV/Excel exports instead
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    // Handle file upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      const clearExisting = formData.get('clearExisting') === 'true'
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded' },
          { status: 400 }
        )
      }
      
      const fileName = file.name.toLowerCase()
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'))
      
      // Validate file extension
      const supportedExtensions = ['.csv', '.xlsx', '.xls']
      if (!supportedExtensions.includes(fileExtension)) {
        return NextResponse.json(
          {
            error: 'Unsupported file format',
            message: `Please upload a CSV or Excel (.xlsx/.xls) file. Got: ${fileExtension}`,
            supported: supportedExtensions
          },
          { status: 400 }
        )
      }

      console.log(`\n=== Starting Parts Import ===`)
      console.log(`File: ${file.name}`)
      console.log(`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)
      console.log(`Format: ${fileExtension}`)
      console.log(`Clear existing: ${clearExisting}`)
      
      // Save uploaded file to temp directory
      const uploadDir = path.join(process.cwd(), 'temp', 'uploads')
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }
      
      const tempFilePath = path.join(uploadDir, `import-${Date.now()}${fileExtension}`)
      const buffer = await file.arrayBuffer()
      await writeFile(tempFilePath, Buffer.from(buffer))
      
      console.log(`Temp file saved: ${tempFilePath}`)
      
      // Clear existing if requested
      if (clearExisting) {
        const deleteCount = await db.masterPart.deleteMany()
        console.log(`Cleared ${deleteCount.count} existing parts`)
      }
      
      let imported = 0
      let updated = 0
      let errors = 0
      let totalParsed = 0
      const startTime = Date.now()
      
      try {
        // Route to appropriate parser based on file extension
        if (fileExtension === '.csv') {
          const result = parsePartsCSV(tempFilePath)
          totalParsed = result.totalRows
          errors = result.skippedRows
          
          console.log(`CSV parsed: ${result.validRows} valid, ${result.skippedRows} skipped`)
          
          // Log first few errors for debugging
          if (result.errors.length > 0) {
            console.log(`\nValidation Errors (showing first 5):`)
            result.errors.slice(0, 5).forEach(err => {
              console.log(`  Row ${err.row}: ${err.error}`)
            })
          }
          
          // Import parts in batches
          const batchSize = 500
          for (let i = 0; i < result.parts.length; i += batchSize) {
            const batch = result.parts.slice(i, i + batchSize)
            
            for (const part of batch) {
              try {
                const existing = await db.masterPart.findUnique({
                  where: { partNumber: part.partNumber }
                })
                
                await db.masterPart.upsert({
                  where: { partNumber: part.partNumber },
                  update: {
                    manufacturer: part.manufacturer,
                    description: part.description,
                    category: part.category,
                    unitPrice: part.unitPrice,
                    currency: part.currency,
                    secondaryDescription: part.secondaryDescription,
                    source: 'csv-import',
                    lastUpdated: new Date(),
                  },
                  create: {
                    partNumber: part.partNumber,
                    manufacturer: part.manufacturer,
                    description: part.description,
                    category: part.category,
                    unitPrice: part.unitPrice,
                    currency: part.currency,
                    secondaryDescription: part.secondaryDescription,
                    source: 'csv-import',
                  },
                })
                
                if (existing) {
                  updated++
                } else {
                  imported++
                }
              } catch (err) {
                console.error(`Error importing part ${part.partNumber}:`, err)
                errors++
              }
            }
            
            console.log(`Progress: ${imported + updated}/${result.parts.length} parts processed`)
          }
          
        } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
          const result = parsePartsExcel(tempFilePath)
          totalParsed = result.totalRows
          errors = result.skippedRows
          
          console.log(`Excel parsed: ${result.validRows} valid, ${result.skippedRows} skipped`)
          
          // Log first few errors for debugging
          if (result.errors.length > 0) {
            console.log(`\nValidation Errors (showing first 5):`)
            result.errors.slice(0, 5).forEach(err => {
              console.log(`  Row ${err.row}: ${err.error}`)
            })
          }
          
          // Import parts in batches
          const batchSize = 500
          for (let i = 0; i < result.parts.length; i += batchSize) {
            const batch = result.parts.slice(i, i + batchSize)
            
            for (const part of batch) {
              try {
                const existing = await db.masterPart.findUnique({
                  where: { partNumber: part.partNumber }
                })
                
                await db.masterPart.upsert({
                  where: { partNumber: part.partNumber },
                  update: {
                    manufacturer: part.manufacturer,
                    description: part.description,
                    category: part.category,
                    unitPrice: part.unitPrice,
                    currency: part.currency,
                    secondaryDescription: part.secondaryDescription,
                    source: 'excel-import',
                    lastUpdated: new Date(),
                  },
                  create: {
                    partNumber: part.partNumber,
                    manufacturer: part.manufacturer,
                    description: part.description,
                    category: part.category,
                    unitPrice: part.unitPrice,
                    currency: part.currency,
                    secondaryDescription: part.secondaryDescription,
                    source: 'excel-import',
                  },
                })
                
                if (existing) {
                  updated++
                } else {
                  imported++
                }
              } catch (err) {
                console.error(`Error importing part ${part.partNumber}:`, err)
                errors++
              }
            }
            
            console.log(`Progress: ${imported + updated}/${result.parts.length} parts processed`)
          }
          
        } else {
          // Should never reach here due to extension validation
          return NextResponse.json(
            { error: 'Unsupported file format' },
            { status: 400 }
          )
        }
        
        // Clean up temp file
        await unlink(tempFilePath)
        console.log(`Temp file deleted: ${tempFilePath}`)
        
      } catch (parseError) {
        console.error('Parse error:', parseError)
        
        // Try to clean up temp file on error
        try {
          await unlink(tempFilePath)
        } catch {
          // Ignore cleanup errors
        }
        
        return NextResponse.json(
          {
            error: 'Failed to parse file',
            format: fileExtension,
            details: (parseError as Error).message
          },
          { status: 500 }
        )
      }
      
      // Calculate duration
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      
      // Clear search cache after import
      clearSearchCache()
      console.log('Search cache cleared after parts import')
      
      console.log(`\n=== Import Complete ===`)
      console.log(`Format: ${fileExtension}`)
      console.log(`Total parsed: ${totalParsed}`)
      console.log(`Imported: ${imported}`)
      console.log(`Updated: ${updated}`)
      console.log(`Errors: ${errors}`)
      console.log(`Duration: ${duration}s`)
      
      return NextResponse.json({
        success: true,
        format: fileExtension,
        summary: {
          totalParsed,
          imported,
          updated,
          errors,
          duration: `${duration}s`
        }
      })
    }
    
    // Handle JSON array (legacy mode for testing)
    const body = await request.json()
    const { parts, clearExisting = false } = body

    if (!Array.isArray(parts)) {
      return NextResponse.json(
        { error: 'Parts must be an array' },
        { status: 400 }
      )
    }

    // Clear existing if requested
    if (clearExisting) {
      await db.masterPart.deleteMany()
    }

    // Import parts in batches
    const batchSize = 1000
    let imported = 0
    let errors = 0

    for (let i = 0; i < parts.length; i += batchSize) {
      const batch = parts.slice(i, i + batchSize)
      
      try {
        // Use upsert to handle duplicates
        for (const part of batch) {
          try {
            await db.masterPart.upsert({
              where: { partNumber: part.partNumber },
              update: {
                manufacturer: part.manufacturer,
                description: part.description,
                secondaryDescription: part.secondaryDescription,
                category: part.category,
                unitPrice: part.unitPrice ? parseFloat(part.unitPrice) : null,
                currency: part.currency,
                supplier: part.supplier,
                source: 'json-import',
                lastUpdated: new Date(),
              },
              create: {
                partNumber: part.partNumber,
                manufacturer: part.manufacturer,
                description: part.description,
                secondaryDescription: part.secondaryDescription,
                category: part.category,
                unitPrice: part.unitPrice ? parseFloat(part.unitPrice) : null,
                currency: part.currency,
                supplier: part.supplier,
                source: 'json-import',
              },
            })
            imported++
          } catch (err) {
            console.error(`Error importing part ${part.partNumber}:`, err)
            errors++
          }
        }
      } catch (batchError) {
        console.error('Batch import error:', batchError)
        errors += batch.length
      }
    }

    // Clear search cache after import
    clearSearchCache()
    console.log('Search cache cleared after parts import')

    return NextResponse.json({
      success: true,
      format: 'json',
      summary: {
        totalParsed: parts.length,
        imported,
        errors,
      }
    })
  } catch (error) {
    console.error('Failed to import parts:', error)
    return NextResponse.json(
      { error: 'Failed to import parts', details: (error as Error).message },
      { status: 500 }
    )
  }
}
