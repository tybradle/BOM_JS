#!/usr/bin/env node

/**
 * Transform Glenair Extractor catalog data to BOM_JS expected format
 * 
 * Source format: { "page_tableIndex": { page, table_index, type, data, headers } }
 * Target format: { tables: [{ page, headers, data, type }] }
 */

const fs = require('fs')
const path = require('path')

const SOURCE_FILE = path.join(__dirname, '../../Glenair Extractor/cache/tables/all_validated_tables.json')
const OUTPUT_FILE = path.join(__dirname, '../src/data/glenair/default-catalog.json')
const METADATA_FILE = path.join(__dirname, '../src/data/glenair/metadata.json')

function transformCatalogData(sourceData) {
  const tables = []
  
  // Sort keys to ensure consistent ordering
  const sortedKeys = Object.keys(sourceData).sort((a, b) => {
    const [pageA, indexA] = a.split('_').map(Number)
    const [pageB, indexB] = b.split('_').map(Number)
    
    if (pageA !== pageB) return pageA - pageB
    return indexA - indexB
  })
  
  for (const key of sortedKeys) {
    const table = sourceData[key]
    
    // Transform to expected format
    const transformedTable = {
      page: table.page,
      headers: table.headers,
      data: table.data,
      type: table.type || categorizeTable(table.headers, table.page)
    }
    
    tables.push(transformedTable)
  }
  
  return { tables }
}

function categorizeTable(headers, page) {
  const headerStr = headers.join(' ').toLowerCase()
  
  // Contact Arrangements
  if (headerStr.includes('arrangement') && headerStr.includes('contact size')) {
    return 'arrangement'
  }
  
  // Pin/Socket Selection (pages 289-292)
  if (page >= 289 && page <= 292) {
    if (headerStr.includes('part number') && headerStr.includes('contact size')) {
      return page <= 290 ? 'pin' : 'socket'
    }
  }
  
  // Wire Map (look for wire size columns)
  if (headerStr.includes('wire size') || headerStr.includes('awg') || headerStr.includes('mm2')) {
    return 'wire_map'
  }
  
  // PHM Map (look for PHM/shell size references)
  if (headerStr.includes('phm') || headerStr.includes('shell size')) {
    return 'phm'
  }
  
  // Default fallback
  return 'other'
}

function createMetadata(tableCount) {
  return {
    name: "Glenair Series 80",
    version: "2024.1",
    description: "Default Glenair connector catalog with contact arrangements, pin/socket specifications, and wire compatibility data",
    source: "Glenair Extractor - all_validated_tables.json",
    transformedAt: new Date().toISOString(),
    tableCount,
    format: "bom-js-v1"
  }
}

// Main execution
try {
  console.log('Reading source catalog data...')
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'))
  
  console.log('Transforming catalog data...')
  const transformedData = transformCatalogData(sourceData)
  
  console.log(`Transformed ${transformedData.tables.length} tables`)
  
  // Create metadata
  const metadata = createMetadata(transformedData.tables.length)
  
  // Write transformed catalog
  console.log('Writing transformed catalog...')
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(transformedData, null, 2), 'utf8')
  
  // Write metadata
  console.log('Writing metadata...')
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8')
  
  console.log('✅ Transformation complete!')
  console.log(`📁 Output: ${OUTPUT_FILE}`)
  console.log(`📋 Metadata: ${METADATA_FILE}`)
  console.log(`📊 Tables: ${transformedData.tables.length}`)
  
  // Show table type breakdown
  const typeCounts = {}
  transformedData.tables.forEach(table => {
    typeCounts[table.type] = (typeCounts[table.type] || 0) + 1
  })
  console.log('\n📈 Table type breakdown:')
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`)
  })
  
} catch (error) {
  console.error('❌ Transformation failed:', error.message)
  process.exit(1)
}