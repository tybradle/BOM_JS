/**
 * Test script for XML Streaming Parser
 * Tests the parser with the large parts.xml file
 */

import path from 'path'
import { parsePartsXML } from '../src/lib/xml-streaming-parser'

const PARTS_FILE = path.join(__dirname, '..', 'Samples', 'Import Sample', 'parts.xml')

async function testStreamingParser() {
  console.log('\n=== Testing XML Streaming Parser ===\n')
  console.log(`File: ${PARTS_FILE}`)
  
  const startTime = Date.now()
  let totalParts = 0
  let batchCount = 0
  
  try {
    for await (const partBatch of parsePartsXML(PARTS_FILE, {
      batchSize: 1000,
      onProgress: (parsed, batch) => {
        console.log(`✓ Parsed ${parsed} parts in ${batch} batches`)
      },
      onError: (error, partNumber) => {
        console.error(`✗ Error parsing part ${partNumber || 'UNKNOWN'}:`, error.message)
      }
    })) {
      batchCount++
      totalParts += partBatch.length
      
      // Log first few parts from first batch
      if (batchCount === 1) {
        console.log(`\n--- Sample parts from first batch ---`)
        partBatch.slice(0, 3).forEach((part, index) => {
          console.log(`\nPart ${index + 1}:`)
          console.log(`  Part Number: ${part.partNumber}`)
          console.log(`  Manufacturer: ${part.manufacturer}`)
          console.log(`  Description: ${part.description?.substring(0, 60)}...`)
          console.log(`  Category: ${part.category || 'N/A'}`)
          console.log(`  Price: ${part.unitPrice ? `$${part.unitPrice}` : 'N/A'}`)
          console.log(`  Supplier: ${part.supplier || 'N/A'}`)
        })
        console.log(`\n-------------------------------------\n`)
      }
      
      console.log(`Batch ${batchCount}: ${partBatch.length} parts (Total: ${totalParts})`)
    }
    
    const duration = Date.now() - startTime
    
    console.log(`\n=== Parsing Complete ===`)
    console.log(`Total parts: ${totalParts}`)
    console.log(`Total batches: ${batchCount}`)
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`)
    console.log(`Average: ${(totalParts / (duration / 1000)).toFixed(0)} parts/second`)
    
  } catch (error) {
    console.error('\n✗ Parsing failed:', error)
    process.exit(1)
  }
}

// Run the test
testStreamingParser()
  .then(() => {
    console.log('\n✓ Test completed successfully\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Test failed:', error)
    process.exit(1)
  })
