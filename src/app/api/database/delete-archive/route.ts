import { NextRequest, NextResponse } from 'next/server'
import { deleteArchive } from '@/lib/database/archive'
import { isPathWithinArchiveDirectories } from '@/lib/database/archives'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const archivePath = url.searchParams.get('path')

    if (!archivePath) {
      return NextResponse.json(
        { error: 'Archive path is required' },
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

    await deleteArchive(archivePath)

    return NextResponse.json({
      success: true,
      message: 'Archive deleted successfully',
      deletedPath: archivePath
    })

  } catch (error) {
    console.error('Failed to delete archive:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete archive' },
      { status: 500 }
    )
  }
}