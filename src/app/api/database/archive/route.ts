import { NextResponse } from 'next/server'
import { collectDatabaseArchives, isPathWithinArchiveDirectories } from '@/lib/database/archives'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

function getPathFromRequest(request: Request): string | null {
  const url = new URL(request.url)
  const pathParam = url.searchParams.get('path')
  return pathParam ? pathParam : null
}

export async function GET(request: Request) {
  const archivePath = getPathFromRequest(request)
  if (!archivePath) {
    return NextResponse.json({ error: 'Missing archive path.' }, { status: 400 })
  }

  if (!isPathWithinArchiveDirectories(archivePath)) {
    return NextResponse.json({ error: 'Archive path is not accessible.' }, { status: 403 })
  }

  try {
  const filename = path.basename(archivePath)
  const fileBuffer = await fs.readFile(archivePath)
  const fileBytes = new Uint8Array(fileBuffer)
  return new Response(fileBytes, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.byteLength.toString()
      }
    })
  } catch (error) {
    console.error('[database-archive-download] Failed to read archive', error)
    const message = error instanceof Error ? error.message : 'Failed to read archive.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
