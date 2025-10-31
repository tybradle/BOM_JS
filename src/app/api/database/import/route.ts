import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { extractDatabaseArchive } from '@/lib/database/archive'
import { ensureDirectory, getDatabaseFilename, resolveBackupDirectory, resolveDatabasePath } from '@/lib/database/paths'
import { validateDatabaseSchema } from '@/lib/database/validation'
import { isPathWithinArchiveDirectories } from '@/lib/database/archives'

const MAX_ARCHIVE_SIZE_BYTES = 150 * 1024 * 1024 // 150 MB safety limit

export const dynamic = 'force-dynamic'

function isZipFilename(filename: string): boolean {
  return filename.toLowerCase().endsWith('.zip')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file')
  const archivePathField = formData.get('archivePath')

  if ((!file || !(file instanceof Blob)) && !archivePathField) {
    return NextResponse.json({ error: 'No archive provided.' }, { status: 400 })
  }

  if (file && !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Invalid archive upload.' }, { status: 400 })
  }

  if (archivePathField && typeof archivePathField !== 'string') {
    return NextResponse.json({ error: 'Invalid archive path.' }, { status: 400 })
  }

  let buffer: Buffer
  let filename: string

  if (file && file instanceof Blob) {
    filename = (file as File).name ?? 'database.zip'

    if (!isZipFilename(filename)) {
      return NextResponse.json({ error: 'Only .zip archives are supported.' }, { status: 400 })
    }

    if (file.size > MAX_ARCHIVE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Archive exceeds maximum allowed size of 150 MB.' }, { status: 413 })
    }

    buffer = Buffer.from(await file.arrayBuffer())
  } else if (archivePathField) {
    if (!isPathWithinArchiveDirectories(archivePathField)) {
      return NextResponse.json({ error: 'Archive path is not permitted.' }, { status: 403 })
    }

    try {
      buffer = await fs.readFile(archivePathField)
      filename = path.basename(archivePathField)
      if (!isZipFilename(filename)) {
        return NextResponse.json({ error: 'Only .zip archives are supported.' }, { status: 400 })
      }
    } catch (error) {
      console.error('[database-import] Failed to read archive path', error)
      const message = error instanceof Error ? error.message : 'Failed to read archive.'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  } else {
    return NextResponse.json({ error: 'No archive provided.' }, { status: 400 })
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bom-db-import-'))
  let disconnected = false
  let backupPath: string | null = null

  try {
    const { databasePath: extractedDatabasePath } = await extractDatabaseArchive(buffer, tempDir)

    const validationResult = await validateDatabaseSchema(extractedDatabasePath)

    const liveDatabasePath = resolveDatabasePath()
    const backupDir = resolveBackupDirectory()
    await ensureDirectory(backupDir)

    if (await fileExists(liveDatabasePath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_')
      const baseName = getDatabaseFilename().replace(/\.db$/i, '')
      backupPath = path.join(backupDir, `${baseName}_preimport_${timestamp}.db`)
      await fs.copyFile(liveDatabasePath, backupPath)
    }

    await db.$disconnect()
    disconnected = true

    await fs.copyFile(extractedDatabasePath, liveDatabasePath)

    await db.$connect()
    disconnected = false

    return NextResponse.json({
      message: 'Database imported successfully.',
      backup: backupPath ? path.basename(backupPath) : null,
      validation: validationResult
    })
  } catch (error: unknown) {
    console.error('[database-import] Failed to import archive', error)

    if (backupPath && (await fileExists(backupPath))) {
      try {
        const liveDatabasePath = resolveDatabasePath()
        await fs.copyFile(backupPath, liveDatabasePath)
      } catch (restoreError) {
        console.error('[database-import] Failed to restore backup after error', restoreError)
      }
    }

    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    if (disconnected) {
      try {
        await db.$connect()
      } catch (reconnectError) {
        console.error('[database-import] Failed to reconnect Prisma client', reconnectError)
      }
    }

    await fs.rm(tempDir, { recursive: true, force: true })
  }
}
