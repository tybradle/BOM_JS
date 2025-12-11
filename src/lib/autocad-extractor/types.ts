// Types for AutoCAD BOM Extractor

export interface BOMItem {
  itemNumber: string
  partNumber: string
  description: string
  manufacturer: string
  quantity: string
  confidence?: number // 0-1 confidence score
  flagged?: boolean // Low confidence flag
}

export interface ExtractionResult {
  items: BOMItem[]
  pageNumber: number
  processingTime: number
}

export interface ProcessingStatus {
  status: 'idle' | 'uploading' | 'converting' | 'processing' | 'complete' | 'error'
  progress: number // 0-100
  message: string
  currentPage?: number
  totalPages?: number
  logs?: string[] // Console logs for user visibility
}

export interface OllamaResponse {
  items: Array<{
    item_number: string
    part_number: string
    description: string
    manufacturer: string
    quantity: string
  }>
}
