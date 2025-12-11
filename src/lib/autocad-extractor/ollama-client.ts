// Ollama client for LLM inference
import { Ollama } from 'ollama'
import type { OllamaResponse } from './types'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'
const MODEL_NAME = 'qwen2.5vl:3b' // Qwen2.5-VL 3B vision model (better for document OCR)

// Create Ollama client instance
const createClient = () => new Ollama({ host: OLLAMA_HOST })

// Generate structured prompt for BOM extraction
const createPrompt = (): string => `
You are a precise OCR system extracting Bill of Materials (BOM) data from an engineering drawing.

CRITICAL INSTRUCTIONS:
1. This table has TWO COLUMNS of items side-by-side
2. Extract EVERY SINGLE ROW from BOTH columns
3. The left column has items numbered 1-66
4. The right column has items numbered 71-141
5. You must extract ALL items - do not stop after a few rows

TABLE STRUCTURE:
- Column headers: # | Part Number | Part Description | Manufacturer | Qty
- Left side: Items 1-66
- Right side: Items 71-141

Return ONLY valid JSON with ALL items in this exact format:
{
  "items": [
    {"item_number": "1", "part_number": "LM86-H-0", "description": "BARREL, FULLY ALUMINUM LUG (F-CRIMP, LONG BARREL) SUITED FOR 4/0 SOW#", "manufacturer": "PANDUIT", "quantity": "3"},
    {"item_number": "2", "part_number": "HM04N3T", "description": "4-1/4\" ALUMINUM NEUTRAL GROUNDING BAR - 15 TERMINALS  #4-#14AWG", "manufacturer": "EXSO", "quantity": "1"},
    ... continue for ALL items through item 141 ...
  ]
}

REQUIREMENTS:
- Extract EVERY row from BOTH columns (should be 70+ items total)
- Preserve exact part numbers and descriptions
- If a field is empty, use empty string ""
- Maintain exact item number sequence
- Do NOT summarize or skip items
- Do NOT add explanatory text outside the JSON
`

// Extract BOM data from image using Ollama
export const extractBOMFromImage = async (
  imageBase64: string
): Promise<OllamaResponse> => {
  const client = createClient()
  const prompt = createPrompt()

  try {
    console.log('[Ollama] Starting generation with model:', MODEL_NAME)
    console.log('[Ollama] Image size:', (imageBase64.length / 1024 / 1024).toFixed(2), 'MB')
    
    const response = await client.generate({
      model: MODEL_NAME,
      prompt,
      images: [imageBase64],
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for consistent output
        top_p: 0.9,
        num_predict: 8192, // Increase max tokens for full BOM extraction
        num_ctx: 8192, // Increase context window
      }
    })

    console.log('[Ollama] Response received, length:', response.response.length)
    console.log('[Ollama] First 500 chars:', response.response.substring(0, 500))

    // Parse JSON response
    const jsonMatch = response.response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[Ollama] No JSON found in response:', response.response)
      throw new Error('No JSON found in response')
    }

    console.log('[Ollama] JSON extracted, length:', jsonMatch[0].length)
    
    const parsed = JSON.parse(jsonMatch[0]) as OllamaResponse
    console.log('[Ollama] Parsed successfully, items count:', parsed.items.length)
    
    return parsed
  } catch (error) {
    console.error('Ollama extraction error:', error)
    throw new Error(`Failed to extract BOM: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Check if Ollama is available and model is installed
export const checkOllamaAvailability = async (): Promise<boolean> => {
  try {
    const client = createClient()
    const models = await client.list()
    // Check for qwen2.5vl or llava models
    return models.models.some(m => m.name.includes('qwen2.5vl') || m.name.includes('llava'))
  } catch (error) {
    console.error('Ollama availability check failed:', error)
    return false
  }
}

// Pull model if not available
export const ensureModelAvailable = async (): Promise<void> => {
  const client = createClient()
  
  try {
    await client.pull({ model: MODEL_NAME, stream: false })
  } catch (error) {
    throw new Error(`Failed to pull model: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
