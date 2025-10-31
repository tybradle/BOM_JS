import { NextRequest, NextResponse } from 'next/server'import { NextRequest, NextResponse } from 'next/server'import { NextRequest, NextResponse } from 'next/server'

import { writeFile, mkdir, unlink } from 'fs/promises'

import { existsSync } from 'fs'import { writeFile, mkdir, unlink } from 'fs/promises'import { writeFile, mkdir, unlink } from 'fs/promises'

import path from 'path'

import { db } from '@/lib/db'import { existsSync } from 'fs'import { existsSync } from 'fs'

import { clearSearchCache } from '@/lib/search-cache'

import { parsePartsXML } from '@/lib/xml-streaming-parser'import path from 'path'import path from 'path'

import { parsePartsCSV, parsePartsExcel } from '@/lib/csv-parser'

import { db } from '@/lib/db'import { db } from '@/lib/db'

/**

 * POST /api/parts/importimport { clearSearchCache } from '@/lib/search-cache'import { clearSearchCache } from '@/lib/search-cache'

 * 

 * Import parts from uploaded fileimport { parsePartsXML } from '@/lib/xml-streaming-parser'import { parsePartsXML } from '@/lib/xml-streaming-parser'

 * 

 * Supported formats:import { parsePartsCSV, parsePartsExcel } from '@/lib/csv-parser'import { parsePartsCSV, parsePartsExcel } from '@/lib/csv-parser'

 * 1. CSV (.csv) - RECOMMENDED: Clean master parts data from SharePoint

 * 2. Excel (.xlsx, .xls) - RECOMMENDED: Clean master parts data from SharePoint

 * 3. XML (.xml) - LEGACY: Eplan XML (deprecated, use CSV/Excel instead)

 * 4. JSON array (application/json) - LEGACY: For testing only/**/**

 */

export async function POST(request: NextRequest) { * POST /api/parts/import * POST /api/parts/import

  try {

    const contentType = request.headers.get('content-type') || '' *  * 

    

    // Handle file upload (multipart/form-data) * Import parts from uploaded file * Import parts from uploaded file

    if (contentType.includes('multipart/form-data')) {

      const formData = await request.formData() *  * 

      const file = formData.get('file') as File

      const clearExisting = formData.get('clearExisting') === 'true' * Supported formats: * Supported formats:

      

      if (!file) { * 1. CSV (.csv) - NEW: Clean master parts data from SharePoint * 1. CSV (.csv) - NEW: Clean master parts data from SharePoint

        return NextResponse.json(

          { error: 'No file uploaded' }, * 2. Excel (.xlsx, .xls) - NEW: Clean master parts data from SharePoint * 2. Excel (.xlsx, .xls) - NEW: Clean master parts data from SharePoint

          { status: 400 }

        ) * 3. XML (.xml) - LEGACY: Eplan XML (deprecated, use CSV/Excel instead) * 3. XML (.xml) - LEGACY: Eplan XML (deprecated, use CSV/Excel instead)

      }

       * 4. JSON array (application/json) - LEGACY: For testing only * 4. JSON array (application/json) - LEGACY: For testing only

      const fileName = file.name.toLowerCase()

      const fileExtension = fileName.substring(fileName.lastIndexOf('.')) */ */

      

      // Validate file extensionexport async function POST(request: NextRequest) {export async function POST(request: NextRequest) {

      const supportedExtensions = ['.csv', '.xlsx', '.xls', '.xml']

      if (!supportedExtensions.includes(fileExtension)) {  try {  try {

        return NextResponse.json(

          {     const contentType = request.headers.get('content-type') || ''    const contentType = request.headers.get('content-type') || ''

            error: 'Unsupported file format', 

            message: `Please upload a CSV, Excel (.xlsx/.xls), or XML file. Got: ${fileExtension}`,        

            supported: supportedExtensions

          },    // Handle file upload (multipart/form-data)    // Handle file upload (multipart/form-data)

          { status: 400 }

        )    if (contentType.includes('multipart/form-data')) {    if (contentType.includes('multipart/form-data')) {

      }

            const formData = await request.formData()      const formData = await request.formData()

      console.log(`\n=== Starting Import ===`)

      console.log(`File: ${file.name}`)      const file = formData.get('file') as File      const file = formData.get('file') as File

      console.log(`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)

      console.log(`Format: ${fileExtension}`)      const clearExisting = formData.get('clearExisting') === 'true'      const clearExisting = formData.get('clearExisting') === 'true'

      console.log(`Clear existing: ${clearExisting}`)

                  

      // Save uploaded file to temp directory

      const uploadDir = path.join(process.cwd(), 'temp', 'uploads')      if (!file) {      if (!file) {

      if (!existsSync(uploadDir)) {

        await mkdir(uploadDir, { recursive: true })        return NextResponse.json(        return NextResponse.json(

      }

                { error: 'No file uploaded' },          { error: 'No file uploaded' },

      const tempFilePath = path.join(uploadDir, `import-${Date.now()}${fileExtension}`)

      const buffer = await file.arrayBuffer()          { status: 400 }          { status: 400 }

      await writeFile(tempFilePath, Buffer.from(buffer))

              )        )

      console.log(`Temp file saved: ${tempFilePath}`)

            }      }

      // Clear existing if requested

      if (clearExisting) {            

        const deleteCount = await db.masterPart.deleteMany()

        console.log(`Cleared ${deleteCount.count} existing parts`)      const fileName = file.name.toLowerCase()      const fileName = file.name.toLowerCase()

      }

            const fileExtension = fileName.substring(fileName.lastIndexOf('.'))      const fileExtension = fileName.substring(fileName.lastIndexOf('.'))

      let imported = 0

      let updated = 0            

      let errors = 0

      let totalParsed = 0      // Validate file extension      // Validate file extension

      let batchCount = 0

      const startTime = Date.now()      const supportedExtensions = ['.csv', '.xlsx', '.xls', '.xml']      const supportedExtensions = ['.csv', '.xlsx', '.xls', '.xml']

      

      try {      if (!supportedExtensions.includes(fileExtension)) {      if (!supportedExtensions.includes(fileExtension)) {

        // Route to appropriate parser based on file extension

        if (fileExtension === '.csv') {        return NextResponse.json(        return NextResponse.json(

          // CSV Import - Clean data format

          console.log('Using CSV parser...')          {           { 

          const result = parsePartsCSV(tempFilePath)

                      error: 'Unsupported file format',             error: 'Unsupported file format', 

          totalParsed = result.totalRows

          errors = result.skippedRows            message: `Please upload a CSV, Excel (.xlsx/.xls), or XML file. Got: ${fileExtension}`,            message: `Please upload a CSV, Excel (.xlsx/.xls), or XML file. Got: ${fileExtension}`,

          

          console.log(`CSV parsed: ${result.validRows} valid, ${result.skippedRows} skipped`)            supported: supportedExtensions            supported: supportedExtensions

          

          // Log first few errors for debugging          },          },

          if (result.errors.length > 0) {

            console.log(`\nValidation Errors (showing first 5):`)          { status: 400 }          { status: 400 }

            result.errors.slice(0, 5).forEach(err => {

              console.log(`  Row ${err.row}: ${err.error}`)        )        )

            })

          }      }      }

          

          // Import parts in batches            

          const batchSize = 500

          for (let i = 0; i < result.parts.length; i += batchSize) {      console.log(`\n=== Starting Import ===`)      console.log(`\n=== Starting Import ===`)

            const batch = result.parts.slice(i, i + batchSize)

            batchCount++      console.log(`File: ${file.name}`)      console.log(`File: ${file.name}`)

            

            for (const part of batch) {      console.log(`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)      console.log(`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)

              try {

                const existing = await db.masterPart.findUnique({      console.log(`Format: ${fileExtension}`)      console.log(`Format: ${fileExtension}`)

                  where: { partNumber: part.partNumber }

                })      console.log(`Clear existing: ${clearExisting}`)      console.log(`Clear existing: ${clearExisting}`)

                

                await db.masterPart.upsert({            

                  where: { partNumber: part.partNumber },

                  update: {      // Save uploaded file to temp directory      // Save uploaded file to temp directory

                    manufacturer: part.manufacturer,

                    description: part.description,      const uploadDir = path.join(process.cwd(), 'temp', 'uploads')      const uploadDir = path.join(process.cwd(), 'temp', 'uploads')

                    category: part.category,

                    unitPrice: part.unitPrice,      if (!existsSync(uploadDir)) {      if (!existsSync(uploadDir)) {

                    currency: part.currency,

                    secondaryDescription: part.secondaryDescription,        await mkdir(uploadDir, { recursive: true })        await mkdir(uploadDir, { recursive: true })

                    source: 'csv-import',

                    lastUpdated: new Date(),      }      }

                  },

                  create: {            

                    partNumber: part.partNumber,

                    manufacturer: part.manufacturer,      const tempFilePath = path.join(uploadDir, `import-${Date.now()}${fileExtension}`)      const tempFilePath = path.join(uploadDir, `import-${Date.now()}${fileExtension}`)

                    description: part.description,

                    category: part.category,      const buffer = await file.arrayBuffer()      const buffer = await file.arrayBuffer()

                    unitPrice: part.unitPrice,

                    currency: part.currency,      await writeFile(tempFilePath, Buffer.from(buffer))      await writeFile(tempFilePath, Buffer.from(buffer))

                    secondaryDescription: part.secondaryDescription,

                    source: 'csv-import',            

                  },

                })      console.log(`Temp file saved: ${tempFilePath}`)      console.log(`Temp file saved: ${tempFilePath}`)

                

                if (existing) {            

                  updated++

                } else {      // Clear existing if requested      // Clear existing if requested

                  imported++

                }      if (clearExisting) {      if (clearExisting) {

              } catch (err) {

                console.error(`Error importing part ${part.partNumber}:`, err)        const deleteCount = await db.masterPart.deleteMany()        const deleteCount = await db.masterPart.deleteMany()

                errors++

              }        console.log(`Cleared ${deleteCount.count} existing parts`)        console.log(`Cleared ${deleteCount.count} existing parts`)

            }

                  }      }

            console.log(`Progress: ${imported + updated}/${result.parts.length} parts processed`)

          }            

          

        } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {      let imported = 0      let imported = 0

          // Excel Import - Clean data format

          console.log('Using Excel parser...')      let updated = 0      let updated = 0

          const result = parsePartsExcel(tempFilePath)

                let errors = 0      let errors = 0

          totalParsed = result.totalRows

          errors = result.skippedRows      let totalParsed = 0      let totalParsed = 0

          

          console.log(`Excel parsed: ${result.validRows} valid, ${result.skippedRows} skipped`)      let batchCount = 0      const startTime = Date.now()

          

          // Log first few errors for debugging      const startTime = Date.now()      

          if (result.errors.length > 0) {

            console.log(`\nValidation Errors (showing first 5):`)            try {

            result.errors.slice(0, 5).forEach(err => {

              console.log(`  Row ${err.row}: ${err.error}`)      try {        // Route to appropriate parser based on file extension

            })

          }        // Route to appropriate parser based on file extension        if (fileExtension === '.csv') {

          

          // Import parts in batches        if (fileExtension === '.csv') {          // CSV Import - NEW clean data format

          const batchSize = 500

          for (let i = 0; i < result.parts.length; i += batchSize) {          // CSV Import - NEW clean data format          console.log('Using CSV parser...')

            const batch = result.parts.slice(i, i + batchSize)

            batchCount++          console.log('Using CSV parser...')          const result = parsePartsCSV(tempFilePath)

            

            for (const part of batch) {          const result = parsePartsCSV(tempFilePath)          

              try {

                const existing = await db.masterPart.findUnique({                    totalParsed = result.totalRows

                  where: { partNumber: part.partNumber }

                })          totalParsed = result.totalRows          errors = result.skippedRows

                

                await db.masterPart.upsert({          errors = result.skippedRows          

                  where: { partNumber: part.partNumber },

                  update: {                    console.log(`CSV parsed: ${result.validRows} valid, ${result.skippedRows} skipped`)

                    manufacturer: part.manufacturer,

                    description: part.description,          console.log(`CSV parsed: ${result.validRows} valid, ${result.skippedRows} skipped`)          

                    category: part.category,

                    unitPrice: part.unitPrice,                    // Log first few errors for debugging

                    currency: part.currency,

                    secondaryDescription: part.secondaryDescription,          // Log first few errors for debugging          if (result.errors.length > 0) {

                    source: 'excel-import',

                    lastUpdated: new Date(),          if (result.errors.length > 0) {            console.log(`\nValidation Errors (showing first 5):`)

                  },

                  create: {            console.log(`\nValidation Errors (showing first 5):`)            result.errors.slice(0, 5).forEach(err => {

                    partNumber: part.partNumber,

                    manufacturer: part.manufacturer,            result.errors.slice(0, 5).forEach(err => {              console.log(`  Row ${err.row}: ${err.error}`)

                    description: part.description,

                    category: part.category,              console.log(`  Row ${err.row}: ${err.error}`)            })

                    unitPrice: part.unitPrice,

                    currency: part.currency,            })          }

                    secondaryDescription: part.secondaryDescription,

                    source: 'excel-import',          }          

                  },

                })                    // Import parts in batches

                

                if (existing) {          // Import parts in batches          const batchSize = 500

                  updated++

                } else {          const batchSize = 500          for (let i = 0; i < result.parts.length; i += batchSize) {

                  imported++

                }          for (let i = 0; i < result.parts.length; i += batchSize) {            const batch = result.parts.slice(i, i + batchSize)

              } catch (err) {

                console.error(`Error importing part ${part.partNumber}:`, err)            const batch = result.parts.slice(i, i + batchSize)            

                errors++

              }            batchCount++            for (const part of batch) {

            }

                                      try {

            console.log(`Progress: ${imported + updated}/${result.parts.length} parts processed`)

          }            for (const part of batch) {                const existing = await db.masterPart.findUnique({

          

        } else if (fileExtension === '.xml') {              try {                  where: { partNumber: part.partNumber }

          // XML Import - LEGACY Eplan format (deprecated)

          console.log('⚠️  Using XML parser (LEGACY - consider migrating to CSV/Excel)')                const existing = await db.masterPart.findUnique({                })

          

          // Parse and import using streaming parser                  where: { partNumber: part.partNumber }                

          for await (const partBatch of parsePartsXML(tempFilePath, {

            batchSize: 1000,                })                await db.masterPart.upsert({

            onProgress: (parsed, batch) => {

              console.log(`Progress: ${parsed} parts parsed in ${batch} batches`)                                  where: { partNumber: part.partNumber },

            },

            onError: (error, partNumber) => {                await db.masterPart.upsert({                  update: {

              console.error(`Error parsing part ${partNumber || 'UNKNOWN'}:`, error.message)

              errors++                  where: { partNumber: part.partNumber },                    manufacturer: part.manufacturer,

            }

          })) {                  update: {                    description: part.description,

            batchCount++

            console.log(`Processing batch ${batchCount} with ${partBatch.length} parts...`)                    manufacturer: part.manufacturer,                    category: part.category,

            totalParsed += partBatch.length

                                description: part.description,                    unitPrice: part.unitPrice,

            // Use batch upsert for better performance

            for (const part of partBatch) {                    category: part.category,                    currency: part.currency,

              try {

                await db.masterPart.upsert({                    unitPrice: part.unitPrice,                    secondaryDescription: part.secondaryDescription,

                  where: { partNumber: part.partNumber },

                  update: {                    currency: part.currency,                    source: 'csv-import',

                    manufacturer: part.manufacturer,

                    description: part.description,                    secondaryDescription: part.secondaryDescription,                    lastUpdated: new Date(),

                    secondaryDescription: part.secondaryDescription,

                    category: part.category,                    source: 'csv-import',                  },

                    unitPrice: part.unitPrice ? parseFloat(part.unitPrice.toString()) : null,

                    supplier: part.supplier,                    lastUpdated: new Date(),                  create: {

                    source: 'xml-import',

                    lastUpdated: new Date(),                  },                    partNumber: part.partNumber,

                  },

                  create: {                  create: {                    manufacturer: part.manufacturer,

                    partNumber: part.partNumber,

                    manufacturer: part.manufacturer,                    partNumber: part.partNumber,                    description: part.description,

                    description: part.description,

                    secondaryDescription: part.secondaryDescription,                    manufacturer: part.manufacturer,                    category: part.category,

                    category: part.category,

                    unitPrice: part.unitPrice ? parseFloat(part.unitPrice.toString()) : null,                    description: part.description,                    unitPrice: part.unitPrice,

                    supplier: part.supplier,

                    source: 'xml-import',                    category: part.category,                    currency: part.currency,

                  },

                })                    unitPrice: part.unitPrice,                    secondaryDescription: part.secondaryDescription,

                imported++

              } catch (err) {                    currency: part.currency,                    source: 'csv-import',

                console.error(`Error importing part ${part.partNumber}:`, err)

                errors++                    secondaryDescription: part.secondaryDescription,                  },

              }

            }                    source: 'csv-import',                })

            

            console.log(`Batch ${batchCount} complete. Total imported: ${imported}`)                  },                

          }

        }                })                if (existing) {

        

        // Clean up temp file                                  updated++

        await unlink(tempFilePath)

        console.log(`Temp file deleted: ${tempFilePath}`)                if (existing) {                } else {

        

      } catch (parseError) {                  updated++                  imported++

        console.error('Parse error:', parseError)

                        } else {                }

        // Try to clean up temp file on error

        try {                  imported++              } catch (err) {

          await unlink(tempFilePath)

        } catch {                }                console.error(`Error importing part ${part.partNumber}:`, err)

          // Ignore cleanup errors

        }              } catch (err) {                errors++

        

        return NextResponse.json(                console.error(`Error importing part ${part.partNumber}:`, err)              }

          {

            error: 'Failed to parse file',                errors++            }

            format: fileExtension,

            details: (parseError as Error).message              }            

          },

          { status: 500 }            }            console.log(`Progress: ${imported + updated}/${result.parts.length} parts processed`)

        )

      }                      }

      

      // Calculate duration            console.log(`Batch ${batchCount}: ${imported + updated}/${result.parts.length} parts processed`)          

      const duration = ((Date.now() - startTime) / 1000).toFixed(1)

                }        } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {

      // Clear search cache after import

      clearSearchCache()                    // Excel Import - NEW clean data format

      console.log('Search cache cleared after parts import')

              } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {          console.log('Using Excel parser...')

      console.log(`\n=== Import Complete ===`)

      console.log(`Format: ${fileExtension}`)          // Excel Import - NEW clean data format          const result = parsePartsExcel(tempFilePath)

      console.log(`Total parsed: ${totalParsed}`)

      console.log(`Imported: ${imported}`)          console.log('Using Excel parser...')          

      console.log(`Updated: ${updated}`)

      console.log(`Errors: ${errors}`)          const result = parsePartsExcel(tempFilePath)          totalParsed = result.totalRows

      console.log(`Batches: ${batchCount}`)

      console.log(`Duration: ${duration}s`)                    errors = result.skippedRows

      

      return NextResponse.json({          totalParsed = result.totalRows          

        success: true,

        format: fileExtension,          errors = result.skippedRows          console.log(`Excel parsed: ${result.validRows} valid, ${result.skippedRows} skipped`)

        summary: {

          totalParsed,                    

          imported,

          updated,          console.log(`Excel parsed: ${result.validRows} valid, ${result.skippedRows} skipped`)          // Log first few errors for debugging

          errors,

          batches: batchCount,                    if (result.errors.length > 0) {

          duration: `${duration}s`

        }          // Log first few errors for debugging            console.log(`\nValidation Errors (showing first 5):`)

      })

    }          if (result.errors.length > 0) {            result.errors.slice(0, 5).forEach(err => {

    

    // Handle JSON array (legacy mode for testing)            console.log(`\nValidation Errors (showing first 5):`)              console.log(`  Row ${err.row}: ${err.error}`)

    const body = await request.json()

    const { parts, clearExisting = false } = body            result.errors.slice(0, 5).forEach(err => {            })



    if (!Array.isArray(parts)) {              console.log(`  Row ${err.row}: ${err.error}`)          }

      return NextResponse.json(

        { error: 'Parts must be an array' },            })          

        { status: 400 }

      )          }          // Import parts in batches

    }

                    const batchSize = 500

    // Clear existing if requested

    if (clearExisting) {          // Import parts in batches          for (let i = 0; i < result.parts.length; i += batchSize) {

      await db.masterPart.deleteMany()

    }          const batchSize = 500            const batch = result.parts.slice(i, i + batchSize)



    // Import parts in batches          for (let i = 0; i < result.parts.length; i += batchSize) {            

    const batchSize = 1000

    let imported = 0            const batch = result.parts.slice(i, i + batchSize)            for (const part of batch) {

    let updated = 0

    let errors = 0            batchCount++              try {



    for (let i = 0; i < parts.length; i += batchSize) {                            const existing = await db.masterPart.findUnique({

      const batch = parts.slice(i, i + batchSize)

                  for (const part of batch) {                  where: { partNumber: part.partNumber }

      try {

        // Use upsert to handle duplicates              try {                })

        for (const part of batch) {

          try {                const existing = await db.masterPart.findUnique({                

            await db.masterPart.upsert({

              where: { partNumber: part.partNumber },                  where: { partNumber: part.partNumber }                await db.masterPart.upsert({

              update: {

                manufacturer: part.manufacturer,                })                  where: { partNumber: part.partNumber },

                description: part.description,

                secondaryDescription: part.secondaryDescription,                                  update: {

                category: part.category,

                unitPrice: part.unitPrice ? parseFloat(part.unitPrice) : null,                await db.masterPart.upsert({                    manufacturer: part.manufacturer,

                currency: part.currency,

                supplier: part.supplier,                  where: { partNumber: part.partNumber },                    description: part.description,

                source: 'json-import',

                lastUpdated: new Date(),                  update: {                    category: part.category,

              },

              create: {                    manufacturer: part.manufacturer,                    unitPrice: part.unitPrice,

                partNumber: part.partNumber,

                manufacturer: part.manufacturer,                    description: part.description,                    currency: part.currency,

                description: part.description,

                secondaryDescription: part.secondaryDescription,                    category: part.category,                    secondaryDescription: part.secondaryDescription,

                category: part.category,

                unitPrice: part.unitPrice ? parseFloat(part.unitPrice) : null,                    unitPrice: part.unitPrice,                    source: 'excel-import',

                currency: part.currency,

                supplier: part.supplier,                    currency: part.currency,                    lastUpdated: new Date(),

                source: 'json-import',

              },                    secondaryDescription: part.secondaryDescription,                  },

            })

            imported++                    source: 'excel-import',                  create: {

          } catch (err) {

            console.error(`Error importing part ${part.partNumber}:`, err)                    lastUpdated: new Date(),                    partNumber: part.partNumber,

            errors++

          }                  },                    manufacturer: part.manufacturer,

        }

      } catch (batchError) {                  create: {                    description: part.description,

        console.error('Batch import error:', batchError)

        errors += batch.length                    partNumber: part.partNumber,                    category: part.category,

      }

    }                    manufacturer: part.manufacturer,                    unitPrice: part.unitPrice,



    // Clear search cache after import                    description: part.description,                    currency: part.currency,

    clearSearchCache()

    console.log('Search cache cleared after parts import')                    category: part.category,                    secondaryDescription: part.secondaryDescription,



    return NextResponse.json({                    unitPrice: part.unitPrice,                    source: 'excel-import',

      success: true,

      format: 'json',                    currency: part.currency,                  },

      summary: {

        totalParsed: parts.length,                    secondaryDescription: part.secondaryDescription,                })

        imported,

        updated,                    source: 'excel-import',                

        errors,

      }                  },                if (existing) {

    })

  } catch (error) {                })                  updated++

    console.error('Failed to import parts:', error)

    return NextResponse.json(                                } else {

      { error: 'Failed to import parts', details: (error as Error).message },

      { status: 500 }                if (existing) {                  imported++

    )

  }                  updated++                }

}

                } else {              } catch (err) {

                  imported++                console.error(`Error importing part ${part.partNumber}:`, err)

                }                errors++

              } catch (err) {              }

                console.error(`Error importing part ${part.partNumber}:`, err)            }

                errors++            

              }            console.log(`Progress: ${imported + updated}/${result.parts.length} parts processed`)

            }          }

                      

            console.log(`Batch ${batchCount}: ${imported + updated}/${result.parts.length} parts processed`)        } else if (fileExtension === '.xml') {

          }          // XML Import - LEGACY Eplan format (deprecated)

                    console.log('⚠️  Using XML parser (LEGACY - consider migrating to CSV/Excel)')

        } else if (fileExtension === '.xml') {          

          // XML Import - LEGACY Eplan format (deprecated)          let batchCount = 0

          console.log('⚠️  Using XML parser (LEGACY - consider migrating to CSV/Excel)')      

                try {

          // Parse and import using streaming parser        // Parse and import using streaming parser

          for await (const partBatch of parsePartsXML(tempFilePath, {        for await (const partBatch of parsePartsXML(tempFilePath, {

            batchSize: 1000,          batchSize: 1000,

            onProgress: (parsed, batch) => {          onProgress: (parsed, batch) => {

              console.log(`Progress: ${parsed} parts parsed in ${batch} batches`)            console.log(`Progress: ${parsed} parts parsed in ${batch} batches`)

            },          },

            onError: (error, partNumber) => {          onError: (error, partNumber) => {

              console.error(`Error parsing part ${partNumber || 'UNKNOWN'}:`, error.message)            console.error(`Error parsing part ${partNumber || 'UNKNOWN'}:`, error.message)

              errors++            errors++

            }          }

          })) {        })) {

            batchCount++          batchCount++

            console.log(`Processing batch ${batchCount} with ${partBatch.length} parts...`)          console.log(`Processing batch ${batchCount} with ${partBatch.length} parts...`)

            totalParsed += partBatch.length          

                      // Use batch upsert for better performance

            // Use batch upsert for better performance          for (const part of partBatch) {

            for (const part of partBatch) {            try {

              try {              await db.masterPart.upsert({

                await db.masterPart.upsert({                where: { partNumber: part.partNumber },

                  where: { partNumber: part.partNumber },                update: {

                  update: {                  manufacturer: part.manufacturer,

                    manufacturer: part.manufacturer,                  description: part.description,

                    description: part.description,                  secondaryDescription: part.secondaryDescription,

                    secondaryDescription: part.secondaryDescription,                  category: part.category,

                    category: part.category,                  unitPrice: part.unitPrice ? parseFloat(part.unitPrice.toString()) : null,

                    unitPrice: part.unitPrice ? parseFloat(part.unitPrice.toString()) : null,                  supplier: part.supplier,

                    supplier: part.supplier,                  lastUpdated: new Date(),

                    source: 'xml-import',                },

                    lastUpdated: new Date(),                create: {

                  },                  partNumber: part.partNumber,

                  create: {                  manufacturer: part.manufacturer,

                    partNumber: part.partNumber,                  description: part.description,

                    manufacturer: part.manufacturer,                  secondaryDescription: part.secondaryDescription,

                    description: part.description,                  category: part.category,

                    secondaryDescription: part.secondaryDescription,                  unitPrice: part.unitPrice ? parseFloat(part.unitPrice.toString()) : null,

                    category: part.category,                  supplier: part.supplier,

                    unitPrice: part.unitPrice ? parseFloat(part.unitPrice.toString()) : null,                },

                    supplier: part.supplier,              })

                    source: 'xml-import',              imported++

                  },            } catch (err) {

                })              console.error(`Error importing part ${part.partNumber}:`, err)

                imported++              errors++

              } catch (err) {            }

                console.error(`Error importing part ${part.partNumber}:`, err)          }

                errors++          

              }          console.log(`Batch ${batchCount} complete. Total imported: ${imported}`)

            }        }

                    

            console.log(`Batch ${batchCount} complete. Total imported: ${imported}`)        // Clean up temp file

          }        const fs = require('fs')

        }        fs.unlinkSync(tempFilePath)

                console.log(`Temp file deleted: ${tempFilePath}`)

        // Clean up temp file        

        await unlink(tempFilePath)      } catch (parseError) {

        console.log(`Temp file deleted: ${tempFilePath}`)        console.error('Parse error:', parseError)

                return NextResponse.json(

        // Calculate duration          { error: 'Failed to parse XML file', details: (parseError as Error).message },

        const duration = ((Date.now() - startTime) / 1000).toFixed(1)          { status: 500 }

                )

        // Clear search cache after import      }

        clearSearchCache()      

        console.log('Search cache cleared after parts import')      // Clear search cache after import

              clearSearchCache()

        console.log(`\n=== Import Complete ===`)      console.log('Search cache cleared after parts import')

        console.log(`Format: ${fileExtension}`)      

        console.log(`Total parsed: ${totalParsed}`)      console.log(`\n=== Import Complete ===`)

        console.log(`Imported: ${imported}`)      console.log(`Total imported: ${imported}`)

        console.log(`Updated: ${updated}`)      console.log(`Errors: ${errors}`)

        console.log(`Errors: ${errors}`)      console.log(`Batches processed: ${batchCount}`)

        console.log(`Batches: ${batchCount}`)      

        console.log(`Duration: ${duration}s`)      return NextResponse.json({

                success: true,

        return NextResponse.json({        totalParsed: imported + errors,

          success: true,        imported,

          format: fileExtension,        updated,

          summary: {        errors,

            totalParsed,        batches: batchCount

            imported,      })

            updated,    }

            errors,    

            batches: batchCount,    // Handle JSON array (legacy mode for testing)

            duration: `${duration}s`    const body = await request.json()

          }    const { parts, clearExisting = false } = body

        })

            if (!Array.isArray(parts)) {

      } catch (parseError) {      return NextResponse.json(

        console.error('Parse error:', parseError)        { error: 'Parts must be an array' },

                { status: 400 }

        // Try to clean up temp file on error      )

        try {    }

          await unlink(tempFilePath)

        } catch {    // Clear existing if requested

          // Ignore cleanup errors    if (clearExisting) {

        }      await db.masterPart.deleteMany()

            }

        return NextResponse.json(

          {     // Import parts in batches

            error: 'Failed to parse file',     const batchSize = 1000

            format: fileExtension,    let imported = 0

            details: (parseError as Error).message     let updated = 0

          },    let errors = 0

          { status: 500 }

        )    for (let i = 0; i < parts.length; i += batchSize) {

      }      const batch = parts.slice(i, i + batchSize)

    }      

          try {

    // Handle JSON array (legacy mode for testing)        // Use upsert to handle duplicates

    const body = await request.json()        for (const part of batch) {

    const { parts, clearExisting = false } = body          try {

            await db.masterPart.upsert({

    if (!Array.isArray(parts)) {              where: { partNumber: part.partNumber },

      return NextResponse.json(              update: {

        { error: 'Parts must be an array' },                manufacturer: part.manufacturer,

        { status: 400 }                description: part.description,

      )                secondaryDescription: part.secondaryDescription,

    }                category: part.category,

                unitPrice: part.unitPrice ? parseFloat(part.unitPrice) : null,

    // Clear existing if requested                supplier: part.supplier,

    if (clearExisting) {                lastUpdated: new Date(),

      await db.masterPart.deleteMany()              },

    }              create: {

                partNumber: part.partNumber,

    // Import parts in batches                manufacturer: part.manufacturer,

    const batchSize = 1000                description: part.description,

    let imported = 0                secondaryDescription: part.secondaryDescription,

    let updated = 0                category: part.category,

    let errors = 0                unitPrice: part.unitPrice ? parseFloat(part.unitPrice) : null,

                supplier: part.supplier,

    for (let i = 0; i < parts.length; i += batchSize) {              },

      const batch = parts.slice(i, i + batchSize)            })

                  imported++

      try {          } catch (err) {

        // Use upsert to handle duplicates            console.error(`Error importing part ${part.partNumber}:`, err)

        for (const part of batch) {            errors++

          try {          }

            await db.masterPart.upsert({        }

              where: { partNumber: part.partNumber },      } catch (batchError) {

              update: {        console.error('Batch import error:', batchError)

                manufacturer: part.manufacturer,        errors += batch.length

                description: part.description,      }

                secondaryDescription: part.secondaryDescription,    }

                category: part.category,

                unitPrice: part.unitPrice ? parseFloat(part.unitPrice) : null,    // Clear search cache after import

                currency: part.currency,    clearSearchCache()

                supplier: part.supplier,    console.log('Search cache cleared after parts import')

                source: 'json-import',

                lastUpdated: new Date(),    return NextResponse.json({

              },      success: true,

              create: {      totalParsed: parts.length,

                partNumber: part.partNumber,      imported,

                manufacturer: part.manufacturer,      updated,

                description: part.description,      errors,

                secondaryDescription: part.secondaryDescription,    })

                category: part.category,  } catch (error) {

                unitPrice: part.unitPrice ? parseFloat(part.unitPrice) : null,    console.error('Failed to import parts:', error)

                currency: part.currency,    return NextResponse.json(

                supplier: part.supplier,      { error: 'Failed to import parts' },

                source: 'json-import',      { status: 500 }

              },    )

            })  }

            imported++}

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
        updated,
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
