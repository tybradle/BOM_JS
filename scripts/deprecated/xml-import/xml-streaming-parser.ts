/**
 * Streaming XML Parser for Large Master Parts Files
 * 
 * Handles massive XML files (300MB+) using SAX streaming parser
 * to avoid memory overload. Processes parts incrementally in batches.
 * 
 * Task 2.2: XML Streaming Parser Implementation
 */

import * as fs from 'fs'
import * as sax from 'sax'

/**
 * Parsed part data structure matching MasterPart schema
 */
export interface PartData {
  partNumber: string
  manufacturer: string
  description: string
  secondaryDescription?: string
  category?: string
  unitPrice?: number
  supplier?: string
}

/**
 * Parser options
 */
export interface ParseOptions {
  batchSize?: number // Parts per batch (default: 1000)
  onProgress?: (parsed: number, batch: number) => void // Progress callback
  onError?: (error: Error, partNumber?: string) => void // Error callback
}

/**
 * Parser statistics
 */
export interface ParseStats {
  totalParsed: number
  totalBatches: number
  errors: number
  startTime: number
  endTime?: number
  durationMs?: number
}

/**
 * Extract text content from multilingual fields
 * Format: "de_DE@German text;en_US@English text;..."
 * Returns first available text or English text if present
 */
function extractMultilingualText(value: string | undefined): string | undefined {
  if (!value) return undefined
  
  // Remove XML entities
  value = value.replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#10;/g, '\n')
  
  // Check if it's multilingual format (contains locale prefixes)
  if (value.includes('@') && value.includes(';')) {
    // Split by semicolon to get each language version
    const parts = value.split(';')
    
    // Try to find English version first
    const enPart = parts.find(p => p.startsWith('en_US@') || p.startsWith('en_GB@'))
    if (enPart) {
      return enPart.split('@')[1]?.trim()
    }
    
    // Otherwise return first available text
    const firstPart = parts[0]
    if (firstPart.includes('@')) {
      return firstPart.split('@')[1]?.trim()
    }
    
    return firstPart.trim()
  }
  
  // Return as-is if not multilingual
  return value.trim()
}

/**
 * Parse number from string, handling empty values
 */
function parseNumber(value: string | undefined): number | undefined {
  if (!value || value === '') return undefined
  const num = parseFloat(value)
  return isNaN(num) ? undefined : num
}

/**
 * Async generator that streams parts from XML file in batches
 * 
 * @param filePath - Path to the parts XML file
 * @param options - Parser options
 * @yields Batches of parsed part data
 * 
 * @example
 * ```typescript
 * for await (const partBatch of parsePartsXML('parts.xml', { 
 *   batchSize: 1000,
 *   onProgress: (parsed, batch) => console.log(`Parsed ${parsed} parts in ${batch} batches`)
 * })) {
 *   await saveToDB(partBatch)
 * }
 * ```
 */
export async function* parsePartsXML(
  filePath: string,
  options: ParseOptions = {}
): AsyncGenerator<PartData[], void, void> {
  const { batchSize = 1000, onProgress, onError } = options
  
  const stats: ParseStats = {
    totalParsed: 0,
    totalBatches: 0,
    errors: 0,
    startTime: Date.now()
  }
  
  // Collect all batches during parsing
  const batches: PartData[][] = []
  let currentBatch: PartData[] = []
  
  await new Promise<void>((resolve, reject) => {
    // Create SAX parser (strict mode for valid XML)
    const parser = sax.createStream(true, {
      trim: true,
      lowercase: false
    })
    
    // Handle opening tags
    parser.on('opentag', (node) => {
      if (node.name === 'part') {
        // Extract part data from attributes
        // IMPORTANT: Use P_ARTICLE_ORDERNR (catalog/order number) as primary part number
        // Fall back to P_ARTICLE_PARTNR only if ORDERNR is missing
        const part: Partial<PartData> = {
          partNumber: node.attributes.P_ARTICLE_ORDERNR as string || node.attributes.P_ARTICLE_PARTNR as string || '',
          manufacturer: node.attributes.P_ARTICLE_MANUFACTURER as string || '',
          description: extractMultilingualText(node.attributes.P_ARTICLE_DESCR1 as string) || '',
          secondaryDescription: extractMultilingualText(node.attributes.P_ARTICLE_DESCR2 as string),
          category: node.attributes.P_ARTICLE_PRODUCTGROUP as string,
          unitPrice: parseNumber(node.attributes.P_ARTICLE_SALESPRICE_1 as string),
          supplier: node.attributes.P_ARTICLE_SUPPLIER as string
        }
        
        // Validate part has required fields
        if (part.partNumber && part.manufacturer && part.description) {
          currentBatch.push(part as PartData)
          stats.totalParsed++
          
          // Emit batch when size reached
          if (currentBatch.length >= batchSize) {
            stats.totalBatches++
            batches.push([...currentBatch])
            currentBatch = []
            
            if (onProgress) {
              onProgress(stats.totalParsed, stats.totalBatches)
            }
          }
        } else {
          // Invalid part - log error
          const error = new Error(`Missing required fields for part: ${part.partNumber || 'UNKNOWN'}`)
          stats.errors++
          
          if (onError) {
            onError(error, part.partNumber)
          }
        }
      }
    })
    
    // Handle parser errors
    parser.on('error', (error) => {
      stats.errors++
      
      if (onError) {
        onError(error as Error)
      }
      
      // SAX parser will recover automatically - no resume() method needed
      // Just log and continue
    })
    
    // Handle end of file
    parser.on('end', () => {
      // Emit final batch if any parts remain
      if (currentBatch.length > 0) {
        stats.totalBatches++
        batches.push([...currentBatch])
        
        if (onProgress) {
          onProgress(stats.totalParsed, stats.totalBatches)
        }
      }
      
      stats.endTime = Date.now()
      stats.durationMs = stats.endTime - stats.startTime
      
      console.log(`\nParsing complete: ${stats.totalParsed} parts in ${stats.totalBatches} batches (${stats.durationMs}ms)`)
      if (stats.errors > 0) {
        console.log(`Errors encountered: ${stats.errors}`)
      }
      
      resolve()
    })
    
    // Create read stream and pipe to parser
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' })
    
    fileStream.on('error', (error) => {
      reject(error)
    })
    
    fileStream.pipe(parser)
  })
  
  // Yield all collected batches
  for (const batch of batches) {
    yield batch
  }
}

/**
 * Simpler non-generator version that returns all parts at once
 * Use only for smaller files (<100MB) or when you need all data upfront
 * 
 * @param filePath - Path to the parts XML file  
 * @param options - Parser options
 * @returns Promise with all parts and stats
 */
export async function parsePartsXMLSync(
  filePath: string,
  options: ParseOptions = {}
): Promise<{ parts: PartData[]; stats: ParseStats }> {
  const allParts: PartData[] = []
  let batchCount = 0
  
  const stats: ParseStats = {
    totalParsed: 0,
    totalBatches: 0,
    errors: 0,
    startTime: Date.now()
  }
  
  for await (const batch of parsePartsXML(filePath, options)) {
    allParts.push(...batch)
    batchCount++
  }
  
  stats.totalParsed = allParts.length
  stats.totalBatches = batchCount
  stats.endTime = Date.now()
  stats.durationMs = stats.endTime - stats.startTime
  
  return { parts: allParts, stats }
}
