import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const { locationId } = await params

    // Check if location exists
    const location = await db.location.findUnique({
      where: { id: locationId },
      include: {
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Delete the location (cascade will delete associated items)
    await db.location.delete({
      where: { id: locationId }
    })

    return NextResponse.json({ 
      message: 'Location deleted successfully',
      deletedItemsCount: location._count.items
    })
  } catch (error) {
    console.error('Failed to delete location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}