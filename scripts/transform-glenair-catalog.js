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

// Split catalog output files
const OUTPUT_DIR = path.join(__dirname, '../src/data/glenair')
const SPLIT_FILES = {
  arrangements: {
    data: path.join(OUTPUT_DIR, 'arrangements.json'),
    metadata: path.join(OUTPUT_DIR, 'arrangements-metadata.json')
  },
  phm: {
    data: path.join(OUTPUT_DIR, 'phm.json'),
    metadata: path.join(OUTPUT_DIR, 'phm-metadata.json')
  },
  pins: {
    data: path.join(OUTPUT_DIR, 'pins.json'),
    metadata: path.join(OUTPUT_DIR, 'pins-metadata.json')
  },
  sockets: {
    data: path.join(OUTPUT_DIR, 'sockets.json'),
    metadata: path.join(OUTPUT_DIR, 'sockets-metadata.json')
  }
}

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
    return 'Contact Arrangements'
  }
  
  // Pin/Socket Selection (pages 289-292)
  if (page >= 289 && page <= 292) {
    if (headerStr.includes('part number') && headerStr.includes('contact size')) {
      return 'Pin/Socket Selection'
    }
  }
  
  // Wire Map (look for wire size columns)
  if (headerStr.includes('wire size') || headerStr.includes('awg') || headerStr.includes('mm2')) {
    return 'Wire Map'
  }
  
  // PHM Map (look for PHM/shell size references)
  if (headerStr.includes('phm') || headerStr.includes('shell size')) {
    return 'PHM'
  }
  
  // Default fallback
  return 'Other'
}

function splitTablesByCategory(tables) {
  const categories = {
    arrangements: [],
    phm: [],
    pins: [],
    sockets: []
  }
  
  tables.forEach(table => {
    const type = (table.type || '').toLowerCase()
    const page = table.page
    
    if (type.includes('arrangement') || type.includes('contact arrangements')) {
      categories.arrangements.push(table)
    } else if (type.includes('phm') || (type.includes('other') && page === 172)) {
      categories.phm.push(table)
    } else if (type.includes('pin/socket')) {
      // Split pins and sockets by page
      if (page === 289 || page === 290) {
        categories.pins.push(table)
      } else if (page === 291 || page === 292) {
        categories.sockets.push(table)
      }
    }
  })
  
  return categories
}

function createCategoryMetadata(category, tables, timestamp) {
  const metadataMap = {
    arrangements: {
      name: 'Glenair Series 80 - Contact Arrangements',
      description: 'Contact arrangement tables showing shell types and contact configurations',
      pages: [39]
    },
    phm: {
      name: 'Glenair Series 80 - PHM Table',
      description: 'PHM (Potting Hub Module) sizing table for shell size to PHM size mapping',
      pages: [172]
    },
    pins: {
      name: 'Glenair Series 80 - Pin Contacts',
      description: 'Pin contact specifications with wire size compatibility',
      pages: [289, 290]
    },
    sockets: {
      name: 'Glenair Series 80 - Socket Contacts',
      description: 'Socket contact specifications with wire size compatibility',
      pages: [291, 292]
    }
  }
  
  const meta = metadataMap[category]
  
  return {
    name: meta.name,
    category: category,
    version: '2024.1',
    description: meta.description,
    source: 'Glenair Extractor - all_validated_tables.json',
    pages: meta.pages,
    transformedAt: timestamp,
    tableCount: tables.length,
    format: 'bom-js-v1'
  }
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
  
  // Write legacy combined catalog (for backward compatibility)
  console.log('Writing legacy combined catalog...')
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(transformedData, null, 2), 'utf8')
  
  // Write legacy metadata
  console.log('Writing legacy metadata...')
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8')
  
  // Split tables by category
  console.log('\nSplitting tables by category...')
  const categories = splitTablesByCategory(transformedData.tables)
  const timestamp = new Date().toISOString()
  
  // Write split files
  Object.entries(categories).forEach(([category, tables]) => {
    if (tables.length > 0) {
      const categoryData = { tables }
      const categoryMetadata = createCategoryMetadata(category, tables, timestamp)
      
      // Write data file
      fs.writeFileSync(
        SPLIT_FILES[category].data,
        JSON.stringify(categoryData, null, 2),
        'utf8'
      )
      
      // Write metadata file
      fs.writeFileSync(
        SPLIT_FILES[category].metadata,
        JSON.stringify(categoryMetadata, null, 2),
        'utf8'
      )
      
      console.log(`✓ Created ${category}.json (${tables.length} tables)`)
    }
  })
  
  console.log('\n✅ Transformation complete!')
  console.log(`📁 Legacy Output: ${OUTPUT_FILE}`)
  console.log(`📋 Legacy Metadata: ${METADATA_FILE}`)
  console.log(`📊 Total Tables: ${transformedData.tables.length}`)
  
  // Show table type breakdown
  const typeCounts = {}
  transformedData.tables.forEach(table => {
    typeCounts[table.type] = (typeCounts[table.type] || 0) + 1
  })
  console.log('\n📈 Table type breakdown:')
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`)
  })
  
  console.log('\n📦 Split files created:')
  Object.entries(categories).forEach(([category, tables]) => {
    console.log(`   ${category}: ${tables.length} tables`)
  })
  
} catch (error) {
  console.error('❌ Transformation failed:', error.message)
  process.exit(1)
}