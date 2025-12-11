// API route for OCR processing
import { NextRequest, NextResponse } from 'next/server'
import { processImage, mergeExtractionResults, validateExtractionResults } from '@/lib/autocad-extractor/ocr-engine'
import { checkOllamaAvailability } from '@/lib/autocad-extractor/ollama-client'

export async function POST(request: NextRequest) {
  try {
    const { images, fileName } = await request.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      )
    }

    console.log(`[OCR] Processing ${images.length} image(s) for ${fileName}`)
    console.log(`[OCR] Image 1 size: ${(images[0].length / 1024 / 1024).toFixed(2)} MB`)

    // Check Ollama availability
    const isAvailable = await checkOllamaAvailability()
    if (!isAvailable) {
      return NextResponse.json(
        { 
          error: 'Ollama not available. Please ensure Ollama is running and vision model is installed.',
          suggestion: 'Run: ollama pull llava or ollama pull qwen2.5vl:3b'
        },
        { status: 503 }
      )
    }

    console.log('[OCR] Ollama is available, starting extraction...')

    // Process the first image (for now, single page support)
    // In production, handle multi-page PDFs
    const startTime = Date.now()
    const result = await processImage(images[0], 1)
    const processingTime = Date.now() - startTime

    console.log(`[OCR] Extraction complete in ${(processingTime / 1000).toFixed(2)}s`)
    console.log(`[OCR] Extracted ${result.items.length} items`)

    // Validate results
    const validation = validateExtractionResults(result.items)

    console.log(`[OCR] Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`)
    if (!validation.isValid) {
      console.log(`[OCR] Validation errors:`, validation.errors)
    }

    return NextResponse.json({
      success: true,
      items: result.items,
      processingTime: result.processingTime,
      validation,
      fileName
    })
  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
