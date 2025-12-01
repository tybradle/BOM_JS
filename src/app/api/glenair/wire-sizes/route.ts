import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { extractWireSizesFromData } from '@/lib/glenair/wire-gauge'

/**
 * GET /api/glenair/wire-sizes
 * Extract available wire sizes from a catalog's pin/socket tables
 * 
 * Query params:
 * - catalogId: string
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const catalogId = searchParams.get('catalogId')

    if (!catalogId) {
      return NextResponse.json(
        { error: 'catalogId is required' },
        { status: 400 }
      )
    }

    // Fetch catalog with pin and socket tables (these have wire size info)
    const catalog = await db.glenairCatalog.findUnique({
      where: { id: catalogId },
      include: {
        tables: {
          where: {
            type: {
              in: ['pin', 'socket', 'pin_socket']
            }
          }
        }
      }
    })

    if (!catalog) {
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      )
    }

    // Collect all rows from pin/socket tables
    const allRows: any[] = []
    for (const table of catalog.tables) {
      const data = table.data as any[]
      allRows.push(...data)
    }

    // Extract wire sizes
    const wireSizes = extractWireSizesFromData(allRows)

    return NextResponse.json({
      catalogId,
      catalogName: catalog.name,
      wireSizes,
      awgCount: wireSizes.awg.length,
      mm2Count: wireSizes.mm2.length
    })
  } catch (error) {
    console.error('Failed to extract wire sizes:', error)
    return NextResponse.json(
      { error: 'Failed to extract wire sizes' },
      { status: 500 }
    )
  }
}
