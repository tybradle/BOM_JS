import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/parts/existing
 * 
 * Get all existing part numbers from the MasterPart database
 * Used for duplicate detection during import
 */
export async function GET() {
  try {
    const parts = await db.masterPart.findMany({
      select: {
        partNumber: true
      },
      orderBy: {
        partNumber: 'asc'
      }
    })

    const partNumbers = parts.map(p => p.partNumber)

    return NextResponse.json({
      partNumbers,
      count: partNumbers.length
    })

  } catch (error) {
    console.error('Failed to fetch existing parts:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch existing parts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}