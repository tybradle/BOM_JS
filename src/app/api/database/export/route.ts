import fs from 'fs/promises'
import { NextResponse } from 'next/server'
import { createDatabaseArchiveBuffer } from '@/lib/database/archive'
import { getDatabaseFilename, resolveDatabasePath } from '@/lib/database/paths'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const databasePath = resolveDatabasePath()
    try {
      await fs.access(databasePath)
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json({ error: 'Database file not found.' }, { status: 404 })
      }
      throw error
    }

  const archiveBuffer = await createDatabaseArchiveBuffer(databasePath)
  const archiveBytes = new Uint8Array(archiveBuffer)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_')
    const baseName = getDatabaseFilename().replace(/\.db$/i, '')
    const fileName = `${baseName}_${timestamp}.zip`

  return new Response(archiveBytes, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': archiveBuffer.byteLength.toString()
      }
    })
  } catch (error: unknown) {
    console.error('[database-export] Failed to create archive', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
