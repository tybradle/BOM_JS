// API route for PDF upload
import { NextRequest, NextResponse } from 'next/server'
import { validatePDF, getPDFPageCount, convertPDFToImages } from '@/lib/autocad-extractor/pdf-processor'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate PDF
    if (!validatePDF(buffer)) {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      )
    }

    // Get page count
    const pageCount = await getPDFPageCount(buffer)

    // Convert PDF to images (PNG format for Ollama)
    const images = await convertPDFToImages(buffer)

    // Store file temporarily (in production, use proper temp storage)
    const fileId = `${Date.now()}-${file.name}`

    return NextResponse.json({
      success: true,
      fileId,
      fileName: file.name,
      pageCount,
      images // Array of base64 PNG images
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
