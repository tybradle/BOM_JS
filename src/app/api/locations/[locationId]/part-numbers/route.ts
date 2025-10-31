import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const { locationId } = await params

    // Get all part numbers for this location
    const items = await db.bOMItem.findMany({
      where: {
        locationId
      },
      select: {
        partNumber: true
      }
    })

    const partNumbers = items.map(item => item.partNumber)

    return NextResponse.json({
      partNumbers
    })

  } catch (error) {
    console.error('Error fetching part numbers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch part numbers' },
      { status: 500 }
    )
  }
}
