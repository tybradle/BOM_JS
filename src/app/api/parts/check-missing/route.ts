import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Check which part numbers are missing from the MasterPart database
 * POST /api/parts/check-missing
 * Body: { partNumbers: string[] }
 * Returns: { missing: string[], existing: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partNumbers } = body

    if (!partNumbers || !Array.isArray(partNumbers)) {
      return NextResponse.json(
        { error: 'partNumbers array is required' },
        { status: 400 }
      )
    }

    if (partNumbers.length === 0) {
      return NextResponse.json({
        missing: [],
        existing: []
      })
    }

    // Limit batch size for performance
    if (partNumbers.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 part numbers per request' },
        { status: 400 }
      )
    }

    // Remove duplicates and empty strings
    const uniquePartNumbers = Array.from(
      new Set(
        partNumbers
          .map(pn => String(pn).trim())
          .filter(pn => pn !== '')
      )
    )

    if (uniquePartNumbers.length === 0) {
      return NextResponse.json({
        missing: [],
        existing: []
      })
    }

    // Query database for existing parts
    const existingParts = await db.masterPart.findMany({
      where: {
        partNumber: {
          in: uniquePartNumbers
        }
      },
      select: {
        partNumber: true
      }
    })

    // Create set of existing part numbers for fast lookup
    const existingPartNumberSet = new Set(
      existingParts.map(p => p.partNumber)
    )

    // Split into missing and existing
    const existing: string[] = []
    const missing: string[] = []

    uniquePartNumbers.forEach(partNumber => {
      if (existingPartNumberSet.has(partNumber)) {
        existing.push(partNumber)
      } else {
        missing.push(partNumber)
      }
    })

    return NextResponse.json({
      missing,
      existing,
      total: uniquePartNumbers.length,
      missingCount: missing.length,
      existingCount: existing.length
    })

  } catch (error) {
    console.error('Failed to check missing parts:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check missing parts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
