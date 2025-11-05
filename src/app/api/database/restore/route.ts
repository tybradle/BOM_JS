import { NextRequest, NextResponse } from 'next/server'
import { extractDatabaseArchive } from '@/lib/database/archive'
import { resolveDatabasePath, resolveDatabaseDirectory } from '@/lib/database/paths'
import * as fs from 'fs/promises'
import * as path from 'path'
import { isPathWithinArchiveDirectories } from '@/lib/database/archives'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { archivePath, createBackup } = body

    if (!archivePath || typeof archivePath !== 'string') {
      return NextResponse.json(
        { error: 'Archive path is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate the archive path is within allowed directories
    if (!isPathWithinArchiveDirectories(archivePath)) {
      return NextResponse.json(
        { error: 'Archive path is not accessible or not within allowed directories' },
        { status: 403 }
      )
    }

    // Check if archive file exists and is readable
    try {
      await fs.access(archivePath, fs.constants.R_OK)
    } catch (error) {
      return NextResponse.json(
        { error: 'Archive file not found or not readable' },
        { status: 404 }
      )
    }

    // Read archive buffer
    const archiveBuffer = await fs.readFile(archivePath)

    // Create backup of current database if requested
    let backupPath: string | null = null
    if (createBackup) {
      const currentDbPath = resolveDatabasePath()
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupFilename = `backup-before-restore-${timestamp}.db`
        const databaseDir = resolveDatabaseDirectory()
        backupPath = path.join(databaseDir, backupFilename)
        await fs.copyFile(currentDbPath, backupPath)
      } catch (error) {
        console.warn('Failed to create backup before restore:', error)
        // Continue with restore even if backup fails
      }
    }

    // Extract archive to temporary directory first
    const tempDir = path.join(resolveDatabaseDirectory(), 'temp-restore')
    await fs.mkdir(tempDir, { recursive: true })

    try {
      const extracted = await extractDatabaseArchive(
        archiveBuffer,
        tempDir,
        (progress) => {
          console.log(`Restore progress: ${progress.stage} - ${progress.progress}% - ${progress.message}`)
        }
      )

      // Move extracted database to replace current one
      const targetDbPath = resolveDatabasePath()
      await fs.copyFile(extracted.databasePath, targetDbPath)

      // Clean up temporary directory
      await fs.rm(tempDir, { recursive: true, force: true })

      return NextResponse.json({
        success: true,
        message: 'Database restored successfully',
        backupPath,
        restoredFrom: archivePath,
        originalSize: extracted.originalSize
      })

    } catch (extractError) {
      // Clean up temporary directory on error
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch (cleanupError) {
        console.error('Failed to clean up temporary directory:', cleanupError)
      }
      throw extractError
    }

  } catch (error) {
    console.error('Failed to restore archive:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore archive' },
      { status: 500 }
    )
  }
}