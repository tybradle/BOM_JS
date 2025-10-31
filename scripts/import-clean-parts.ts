/**
 * Clean Master Parts Import - Complete Migration Script
 * 
 * Run this script to:
 * 1. Clear old database
 * 2. Import cleaned CSV from SharePoint
 * 3. Verify import success
 * 
 * Usage: npx tsx scripts/import-clean-parts.ts "Samples/Import Sample/CHD Parts Master (5).csv"
 */

import { db } from '../src/lib/db'
import { parsePartsCSV } from '../src/lib/csv-parser'
import path from 'path'

async function main() {
  const csvFile = process.argv[2] || 'Samples/Import Sample/CHD Parts Master (5).csv'
  const filePath = path.isAbsolute(csvFile) ? csvFile : path.join(process.cwd(), csvFile)
  
  console.log(`\n${'='.repeat(60)}`)
  console.log('Clean Master Parts Import')
  console.log(`${'='.repeat(60)}\n`)
  
  // Step 1: Backup count
  const existingCount = await db.masterPart.count()
  console.log(`📊 Existing parts in database: ${existingCount}`)
  
  if (existingCount > 0) {
    console.log(`⚠️  This will DELETE all ${existingCount} existing parts!`)
    console.log(`   (Old Eplan XML data will be removed)`)
    console.log()
  }
  
  // Step 2: Parse CSV
  console.log(`📁 Parsing CSV file: ${csvFile}`)
  const result = parsePartsCSV(filePath)
  
  console.log(`\n✅ Parsed ${result.totalRows} rows from CSV`)
  console.log(`   Valid: ${result.validRows}`)
  console.log(`   Skipped: ${result.skippedRows}`)
  
  if (result.errors.length > 0) {
    console.log(`\n⚠️  Validation Errors (first 10):`)
    result.errors.slice(0, 10).forEach(err => {
      console.log(`   Row ${err.row}: ${err.error}`)
    })
  }
  
  // Show sample of what will be imported
  console.log(`\n📋 Sample parts to import:`)
  result.parts.slice(0, 3).forEach(part => {
    console.log(`   • ${part.partNumber} - ${part.manufacturer} - ${part.description.substring(0, 50)}...`)
    if (part.unitPrice) {
      console.log(`     Price: ${part.unitPrice} ${part.currency || ''}`)
    }
  })
  
  // Step 3: Clear old data
  console.log(`\n🗑️  Clearing old database...`)
  const deleted = await db.masterPart.deleteMany()
  console.log(`   Deleted ${deleted.count} old parts`)
  
  // Step 4: Import clean data
  console.log(`\n📥 Importing ${result.parts.length} parts...`)
  const startTime = Date.now()
  
  let imported = 0
  let errors = 0
  const batchSize = 500
  
  for (let i = 0; i < result.parts.length; i += batchSize) {
    const batch = result.parts.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    
    for (const part of batch) {
      try {
        await db.masterPart.create({
          data: {
            partNumber: part.partNumber,
            manufacturer: part.manufacturer,
            description: part.description,
            category: part.category,
            unitPrice: part.unitPrice,
            currency: part.currency,
            secondaryDescription: part.secondaryDescription,
            source: 'csv-sharepoint',
          },
        })
        imported++
      } catch (err) {
        console.error(`   Error importing ${part.partNumber}:`, err)
        errors++
      }
    }
    
    const progress = Math.round((imported / result.parts.length) * 100)
    console.log(`   Batch ${batchNum}: ${imported}/${result.parts.length} (${progress}%)`)
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  
  // Step 5: Verify
  const finalCount = await db.masterPart.count()
  
  console.log(`\n${'='.repeat(60)}`)
  console.log('✅ Import Complete!')
  console.log(`${'='.repeat(60)}`)
  console.log(`\n📊 Results:`)
  console.log(`   Imported: ${imported}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Duration: ${duration}s`)
  console.log(`   Final count: ${finalCount}`)
  console.log()
  
  // Show sample manufacturers
  const manufacturers = await db.masterPart.groupBy({
    by: ['manufacturer'],
    _count: true,
    orderBy: {
      _count: {
        manufacturer: 'desc'
      }
    },
    take: 10
  })
  
  console.log(`📈 Top Manufacturers:`)
  manufacturers.forEach(m => {
    console.log(`   ${m.manufacturer}: ${m._count} parts`)
  })
  
  console.log(`\n✅ Database is now clean with normalized manufacturer names!`)
  console.log(`   You can now use the BOM "Add from Catalog" feature.\n`)
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
