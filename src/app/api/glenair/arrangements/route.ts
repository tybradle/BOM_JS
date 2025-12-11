import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { findArrangements, createDataFrame } from '@/lib/glenair'

/**
 * GET /api/glenair/arrangements
 * Look up available arrangements based on conductor count and contact size
 * 
 * Query params:
 * - conductorCount: number
 * - contactSize: string (e.g., "22D")
 * - catalogId: string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const catalogId = searchParams.get('catalogId')
    const conductorCountStr = searchParams.get('conductorCount')
    const contactSize = searchParams.get('contactSize')

    console.log('🔍 [API] Arrangements request:', { catalogId, conductorCount: conductorCountStr, contactSize })

    // Validate required parameters
    if (!catalogId || !conductorCountStr || !contactSize) {
      console.error('🔍 [API] Missing parameters:', { 
        catalogId: !!catalogId, 
        conductorCount: !!conductorCountStr, 
        contactSize: !!contactSize 
      })
      return NextResponse.json(
        { error: 'Missing required parameters: catalogId, conductorCount, contactSize' },
        { status: 400 }
      )
    }

    const conductorCount = parseInt(conductorCountStr, 10)
    if (isNaN(conductorCount) || conductorCount < 1) {
      return NextResponse.json(
        { error: 'conductorCount must be a positive number' },
        { status: 400 }
      )
    }

    // Get catalog from database
    console.log('🔍 [API] Getting catalog:', catalogId)
    const catalog = await db.glenairCatalog.findUnique({
      where: { id: catalogId },
      include: {
        tables: {
          where: { type: 'arrangement' },
          orderBy: { page: 'asc' }
        }
      }
    })

    if (!catalog) {
      console.error('🔍 [API] Catalog not found:', catalogId)
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      )
    }

    console.log('🔍 [API] Catalog found:', catalog.name, 'version:', catalog.version)

    if (catalog.tables.length === 0) {
      console.log('🔍 [API] No arrangement tables found in catalog')
      return NextResponse.json({ arrangements: [] })
    }

    // Build DataFrame from arrangement tables
    const arrangementData: any[][] = []
    const arrangementColumns: string[] = []
    
    for (const table of catalog.tables) {
      const headers = table.headers as string[]
      const rawData = table.data as any[]
      
      // Convert object rows to array rows if needed
      const data = rawData.map(row => {
        if (Array.isArray(row)) {
          return row
        }
        // Row is an object, convert to array using headers order
        return headers.map(h => row[h] ?? '')
      })
      
      arrangementData.push(...data)
      if (arrangementColumns.length === 0) {
        arrangementColumns.push(...headers)
      }
    }

    console.log('🔍 [API] Built DataFrame with', arrangementData.length, 'rows and', arrangementColumns.length, 'columns')

    const arrangementDf = createDataFrame(arrangementData, arrangementColumns)

    // Find matching arrangements
    console.log('🔍 [API] Finding arrangements for conductorCount:', conductorCount, 'contactSize:', contactSize)
    const arrangements = findArrangements(
      conductorCount,
      contactSize,
      arrangementDf.data,
      arrangementDf.columns
    )

    console.log('🔍 [API] Found arrangements:', arrangements.length, 'arrangements')
    console.log('🔍 [API] Arrangement details:', arrangements.map(a => ({ arrangement: a.arrangement, count: a.count })))

    return NextResponse.json({ arrangements })
  } catch (error) {
    console.error('🔍 [API] Error fetching Glenair arrangements:', error)
    console.error('🔍 [API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}