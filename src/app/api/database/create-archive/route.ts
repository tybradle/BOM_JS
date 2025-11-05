import { NextRequest, NextResponse } from 'next/server'
import { createDatabaseArchiveBuffer } from '@/lib/database/archive'
import { resolveDatabasePath, resolveDatabaseDirectory, getArchiveDirectories } from '@/lib/database/paths'
import * as fs from 'fs/promises'
import * as path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description } = body

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required and must be a string' },
        { status: 400 }
      )
    }

    // Get database path and validate it exists
    const databasePath = resolveDatabasePath()
    try {
      await fs.access(databasePath)
    } catch (error) {
      return NextResponse.json(
        { error: 'Database file not found or not accessible' },
        { status: 404 }
      )
    }

    // Create archive buffer with progress tracking
    const archiveBuffer = await createDatabaseArchiveBuffer(
      databasePath,
      (progress) => {
        // In a real implementation, you could use Server-Sent Events for progress
        console.log(`Archive progress: ${progress.stage} - ${progress.progress}% - ${progress.message}`)
      }
    )
    
    // Generate filename with timestamp and sanitized description
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const sanitizedDescription = description.replace(/[^a-zA-Z0-9\s-_]/g, '').trim().replace(/\s+/g, '_')
    const filename = `bom-archive-${timestamp}-${sanitizedDescription}.zip`
    
    // Save to archives directory
    const archiveDirs = getArchiveDirectories()
    const archivesDir = archiveDirs[0] || path.join(resolveDatabaseDirectory(), 'backups')
    await fs.mkdir(archivesDir, { recursive: true })
    const archivePath = path.join(archivesDir, filename)
    
    await fs.writeFile(archivePath, archiveBuffer)

    return NextResponse.json({
      success: true,
      filename,
      path: archivePath,
      size: archiveBuffer.length,
      description,
      createdAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to create archive:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create archive' },
      { status: 500 }
    )
  }
}