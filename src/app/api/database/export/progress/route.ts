import { NextRequest } from 'next/server'
import { createDatabaseArchiveBuffer } from '@/lib/database/archive'
import { getDatabaseFilename, resolveDatabasePath } from '@/lib/database/paths'
import fs from 'fs/promises'

export const dynamic = 'force-dynamic'

interface ExportProgress {
  stage: 'validating' | 'reading' | 'compressing' | 'finalizing' | 'completed' | 'error'
  progress: number // 0-100
  message: string
  details?: string
}

async function createArchiveWithProgress(
  databasePath: string,
  onProgress: (progress: ExportProgress) => void
): Promise<Buffer> {
  try {
    // Stage 1: Validating database file
    onProgress({
      stage: 'validating',
      progress: 10,
      message: 'Validating database file...',
      details: 'Checking if database exists and is accessible'
    })

    try {
      await fs.access(databasePath)
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('Database file not found.')
      }
      throw error
    }

    // Stage 2: Reading database file
    onProgress({
      stage: 'reading',
      progress: 30,
      message: 'Reading database file...',
      details: 'Loading database into memory for compression'
    })

    const stats = await fs.stat(databasePath)
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)

    // Stage 3: Compressing database
    onProgress({
      stage: 'compressing',
      progress: 50,
      message: 'Compressing database...',
      details: `Creating archive from ${fileSizeInMB} MB database file`
    })

    const archiveBuffer = await createDatabaseArchiveBuffer(databasePath)

    // Stage 4: Finalizing
    onProgress({
      stage: 'finalizing',
      progress: 90,
      message: 'Finalizing archive...',
      details: 'Preparing archive for download'
    })

    // Stage 5: Completed
    onProgress({
      stage: 'completed',
      progress: 100,
      message: 'Archive ready for download',
      details: `Archive size: ${(archiveBuffer.byteLength / (1024 * 1024)).toFixed(2)} MB`
    })

    return archiveBuffer
  } catch (error) {
    onProgress({
      stage: 'error',
      progress: 0,
      message: 'Export failed',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    })
    throw error
  }
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (progress: ExportProgress) => {
        const data = `data: ${JSON.stringify(progress)}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      try {
        // Send initial progress
        sendProgress({
          stage: 'validating',
          progress: 0,
          message: 'Starting database export...',
          details: 'Initializing export process'
        })

        const databasePath = resolveDatabasePath()
        const archiveBuffer = await createArchiveWithProgress(databasePath, sendProgress)
        
        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_')
        const baseName = getDatabaseFilename().replace(/\.db$/i, '')
        const fileName = `${baseName}_${timestamp}.zip`

        // Convert buffer to base64 for transmission
        const base64Data = archiveBuffer.toString('base64')
        
        // Send completion with download data
        sendProgress({
          stage: 'completed',
          progress: 100,
          message: 'Export completed successfully',
          details: `Archive ${fileName} is ready for download`
        })

        // Send the file data as the final message
        const downloadData = {
          type: 'download',
          filename: fileName,
          data: base64Data,
          size: archiveBuffer.byteLength
        }
        
        const finalData = `data: ${JSON.stringify(downloadData)}\n\n`
        controller.enqueue(encoder.encode(finalData))
        
        // Close the stream
        controller.close()
      } catch (error) {
        console.error('[database-export-progress] Export failed', error)
        const message = error instanceof Error ? error.message : 'Unexpected error'
        
        sendProgress({
          stage: 'error',
          progress: 0,
          message: 'Export failed',
          details: message
        })
        
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}