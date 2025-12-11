'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileUploader } from '@/components/autocad-extractor/FileUploader'
import { ProcessingStatus } from '@/components/autocad-extractor/ProcessingStatus'
import { ProcessingConsole } from '@/components/autocad-extractor/ProcessingConsole'
import { ResultsTable } from '@/components/autocad-extractor/ResultsTable'
import { ExportButton } from '@/components/autocad-extractor/ExportButton'
import { convertPDFToImagesClient } from '@/lib/autocad-extractor/client-pdf-converter'
import type { BOMItem, ProcessingStatus as Status } from '@/lib/autocad-extractor/types'

export default function AutoCADExtractorPage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedItems, setExtractedItems] = useState<BOMItem[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<Status>({
    status: 'idle',
    progress: 0,
    message: ''
  })

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message])
  }

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    setExtractedItems([])
    setLogs([]) // Clear previous logs
    
    // Start processing
    await processFile(file)
  }

  const processFile = async (file: File) => {
    try {
      addLog(`📄 File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
      
      // Convert PDF to images (client-side)
      setStatus({
        status: 'converting',
        progress: 20,
        message: 'Converting PDF to images...'
      })
      addLog('🔄 Starting PDF to image conversion...')

      const startTime = Date.now()
      let totalPagesDetected = 0
      const images = await convertPDFToImagesClient(file, (current, total) => {
        if (totalPagesDetected === 0) {
          totalPagesDetected = total
          addLog(`📋 PDF contains ${total} page(s) - processing page 1 only`)
        }
        addLog(`📄 Converting page ${current} of ${total}...`)
      })
      const conversionTime = ((Date.now() - startTime) / 1000).toFixed(2)
      
      addLog(`✅ Converted ${images.length} page(s) to PNG format in ${conversionTime}s`)
      addLog(`📊 Image resolution: High quality (2x scale for better OCR)`)
      addLog(`💾 Image size: ${(images[0].length / 1024 / 1024).toFixed(2)} MB`)

      // Process with Ollama
      setStatus({
        status: 'processing',
        progress: 50,
        message: 'Extracting BOM data with AI...',
        currentPage: 1,
        totalPages: images.length
      })
      addLog('🤖 Sending to Ollama AI for BOM extraction...')
      addLog(`🔍 Using model: qwen2.5vl:3b`)

      const processStartTime = Date.now()
      const processResponse = await fetch('/api/autocad-extractor/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images,
          fileName: file.name
        })
      })

      if (!processResponse.ok) {
        const errorData = await processResponse.json()
        addLog(`❌ Error: ${errorData.error}`)
        throw new Error(errorData.error || 'Processing failed')
      }

      const processData = await processResponse.json()
      const processingTime = ((Date.now() - processStartTime) / 1000).toFixed(2)

      addLog(`✅ AI processing complete in ${processingTime}s`)
      addLog(`📋 Extracted ${processData.items.length} BOM items`)
      
      const flaggedCount = processData.items.filter((item: BOMItem) => item.flagged).length
      if (flaggedCount > 0) {
        addLog(`⚠️  ${flaggedCount} items flagged for manual review (low confidence)`)
      }

      // Complete
      setStatus({
        status: 'complete',
        progress: 100,
        message: `Successfully extracted ${processData.items.length} items`
      })
      addLog(`🎉 Extraction complete! Ready to export to Excel.`)

      setExtractedItems(processData.items)
    } catch (error) {
      console.error('Processing error:', error)
      addLog(`❌ Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setStatus({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Processing failed'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-orange-800 rounded-lg flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                AutoCAD BOM Extractor
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Extract BOMs from AutoCAD PDF drawings using AI-powered OCR
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* File Upload */}
          <FileUploader
            onFileSelect={handleFileSelect}
            disabled={status.status === 'uploading' || status.status === 'processing'}
          />

          {/* Processing Status */}
          <ProcessingStatus status={status} />

          {/* Processing Console */}
          <ProcessingConsole logs={logs} />

          {/* Results Table */}
          {extractedItems.length > 0 && (
            <>
              <ResultsTable items={extractedItems} />
              
              {/* Export Button */}
              <ExportButton
                items={extractedItems}
                fileName={selectedFile?.name || 'BOM'}
                disabled={status.status === 'processing'}
              />
            </>
          )}

          {/* Instructions */}
          {status.status === 'idle' && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                How to use:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
                <li>Upload an AutoCAD BOM PDF drawing</li>
                <li>Wait for AI to extract the BOM table data</li>
                <li>Review extracted items (flagged items need manual review)</li>
                <li>Export to Excel spreadsheet</li>
              </ol>
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Ensure Ollama is running with qwen2-vl:2b model installed.
                  Run: <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">ollama pull qwen2-vl:2b</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
