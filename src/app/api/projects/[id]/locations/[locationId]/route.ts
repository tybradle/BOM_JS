import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; locationId: string }> }
) {
  try {
    const { id: projectId, locationId } = await params

    // Check if location exists and belongs to the project
    const location = await db.location.findFirst({
      where: {
        id: locationId,
        projectId
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Delete the location (this will cascade delete all items in this location)
    await db.location.delete({
      where: { id: locationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}