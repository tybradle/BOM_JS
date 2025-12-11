// OCR processing engine
import { extractBOMFromImage } from './ollama-client'
import type { BOMItem, ExtractionResult, OllamaResponse } from './types'

const CONFIDENCE_THRESHOLD = 0.8

// Process single image and extract BOM items
export const processImage = async (
  imageBase64: string,
  pageNumber: number
): Promise<ExtractionResult> => {
  const startTime = Date.now()

  try {
    const response = await extractBOMFromImage(imageBase64)
    const items = parseOllamaResponse(response)
    const processingTime = Date.now() - startTime

    return {
      items,
      pageNumber,
      processingTime
    }
  } catch (error) {
    throw new Error(`Page ${pageNumber} processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Parse Ollama response and add confidence scoring
const parseOllamaResponse = (response: OllamaResponse): BOMItem[] => {
  return response.items.map((item) => {
    const confidence = calculateConfidence(item)
    const flagged = confidence < CONFIDENCE_THRESHOLD

    return {
      itemNumber: item.item_number || '',
      partNumber: item.part_number || '',
      description: item.description || '',
      manufacturer: item.manufacturer || '',
      quantity: item.quantity || '',
      confidence,
      flagged
    }
  })
}

// Calculate confidence score based on field completeness
const calculateConfidence = (item: OllamaResponse['items'][0]): number => {
  let score = 0
  let maxScore = 5

  // Item number (required)
  if (item.item_number && item.item_number.trim()) score += 1

  // Part number (required)
  if (item.part_number && item.part_number.trim()) score += 1.5

  // Description (required)
  if (item.description && item.description.trim()) score += 1.5

  // Manufacturer (optional but valuable)
  if (item.manufacturer && item.manufacturer.trim()) score += 0.5

  // Quantity (required)
  if (item.quantity && item.quantity.trim()) score += 0.5

  return score / maxScore
}

// Merge results from multiple pages
export const mergeExtractionResults = (
  results: ExtractionResult[]
): BOMItem[] => {
  const allItems: BOMItem[] = []

  results.forEach((result) => {
    allItems.push(...result.items)
  })

  // Sort by item number
  return allItems.sort((a, b) => {
    const numA = parseInt(a.itemNumber) || 0
    const numB = parseInt(b.itemNumber) || 0
    return numA - numB
  })
}

// Validate extraction results
export const validateExtractionResults = (items: BOMItem[]): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []

  if (items.length === 0) {
    errors.push('No items extracted')
  }

  const missingPartNumbers = items.filter(item => !item.partNumber.trim())
  if (missingPartNumbers.length > 0) {
    errors.push(`${missingPartNumbers.length} items missing part numbers`)
  }

  const lowConfidenceCount = items.filter(item => item.flagged).length
  if (lowConfidenceCount > items.length * 0.5) {
    errors.push(`High number of low-confidence items: ${lowConfidenceCount}/${items.length}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
