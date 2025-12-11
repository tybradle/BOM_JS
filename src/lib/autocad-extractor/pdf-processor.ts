// PDF processing utilities
import { PDFDocument } from 'pdf-lib'

// For now, return PDF as base64 - Ollama vision models can handle PDFs directly
export const convertPDFToImages = async (
  pdfBuffer: Buffer
): Promise<string[]> => {
  try {
    // Return PDF as base64 - some vision models accept PDF directly
    // If this doesn't work, we'll need to implement proper image conversion
    const base64 = pdfBuffer.toString('base64')
    return [base64]
  } catch (error) {
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get page count from PDF
export const getPDFPageCount = async (pdfBuffer: Buffer): Promise<number> => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    return pdfDoc.getPageCount()
  } catch (error) {
    throw new Error(`Failed to read PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Validate PDF file
export const validatePDF = (buffer: Buffer): boolean => {
  // Check PDF magic number
  const header = buffer.toString('ascii', 0, 5)
  return header === '%PDF-'
}
