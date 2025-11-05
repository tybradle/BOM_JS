import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const archivePath = body.archivePath;

    if (!archivePath) {
      return NextResponse.json({ error: 'Missing archive path.' }, { status: 400 })
    }

    if (!isPathWithinArchiveDirectories(archivePath)) {
      return NextResponse.json({ error: 'Archive path is not accessible.' }, { status: 403 })
    }

    // Check if file exists
    try {
      await fs.access(archivePath)
    } catch {
      return NextResponse.json({ error: 'Archive file not found.' }, { status: 404 })
    }

    // Read and return the archive file
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
    console.error('[database-archive-post] Failed to process archive', error)
    const message = error instanceof Error ? error.message : 'Failed to process archive.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
