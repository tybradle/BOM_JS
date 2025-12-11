// Client-side PDF to image conversion using PDF.js
import * as pdfjsLib from 'pdfjs-dist'

// Set worker path for PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

// Convert PDF file to base64 PNG images (client-side)
export const convertPDFToImagesClient = async (
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    console.log(`PDF has ${pdf.numPages} pages`)
    
    const images: string[] = []
    
    // For now, only process first page (BOMs are typically single page)
    // TODO: Add multi-page support if needed
    const pagesToProcess = Math.min(pdf.numPages, 1)
    
    // Convert each page to PNG
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      if (onProgress) {
        onProgress(pageNum, pagesToProcess)
      }
      
      const page = await pdf.getPage(pageNum)
      
      // Set scale for high quality (2x for better OCR)
      const scale = 2.0
      const viewport = page.getViewport({ scale })
      
      // Create canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to get canvas context')
      }
      
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      console.log(`Rendering page ${pageNum}: ${canvas.width}x${canvas.height}px`)
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      // Convert canvas to base64 PNG
      const base64 = canvas.toDataURL('image/png').split(',')[1]
      images.push(base64)
      
      console.log(`Page ${pageNum} converted: ${(base64.length / 1024 / 1024).toFixed(2)} MB`)
    }
    
    return images
  } catch (error) {
    throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
