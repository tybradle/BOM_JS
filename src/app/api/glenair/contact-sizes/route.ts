import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompatibleContactSizes } from '@/lib/glenair/wire-gauge'
import type { WireSystem } from '@/types/glenair'
import type { ContactSizeInfo } from '@/lib/glenair/wire-gauge'

// Simple in-memory cache for contact size lookups
interface CacheEntry {
  data: {
    wireValue: string
    wireSystem: WireSystem
    catalogId: string
    contactSizes: ContactSizeInfo[]
    totalSizes: number
  }
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * GET /api/glenair/contact-sizes
 * Get compatible contact sizes for a given wire gauge
 * 
 * Query params:
 * - wireValue: string (e.g., "22", "0.5")
 * - wireSystem: "AWG" | "MM2"
 * - catalogId: string
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const wireValue = searchParams.get('wireValue')
    const wireSystem = searchParams.get('wireSystem') as WireSystem | null
    const catalogId = searchParams.get('catalogId')

    // Validate required params
    if (!wireValue) {
      return NextResponse.json(
        { error: 'wireValue is required' },
        { status: 400 }
      )
    }

    if (!wireSystem || !['AWG', 'MM2'].includes(wireSystem)) {
      return NextResponse.json(
        { error: 'wireSystem must be AWG or MM2' },
        { status: 400 }
      )
    }

    if (!catalogId) {
      return NextResponse.json(
        { error: 'catalogId is required' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedWireValue = wireValue.trim().slice(0, 20)
    const sanitizedCatalogId = catalogId.trim().slice(0, 50)

    // Check cache first
    const cacheKey = `${sanitizedCatalogId}-${sanitizedWireValue}-${wireSystem}`
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Fetch catalog with pin and socket tables
    const catalog = await db.glenairCatalog.findUnique({
      where: { id: sanitizedCatalogId },
      include: {
        tables: {
          where: {
            type: {
              in: ['pin', 'socket', 'pin_socket', 'Pin/Socket Selection', 'Pin Socket Selection']
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

    if (catalog.tables.length === 0) {
      return NextResponse.json(
        { error: 'No pin/socket tables found in catalog' },
        { status: 404 }
      )
    }

    // Combine all pin/socket data into a single array
    const allContactData: Record<string, unknown>[] = []
    
    for (const table of catalog.tables) {
      const headers = table.headers as string[]
      const data = table.data as unknown[]
      
      // Validate table structure
      if (!Array.isArray(headers) || !Array.isArray(data)) {
        console.warn(`Skipping malformed table: ${table.id}`)
        continue
      }
      
      // Convert each row to an object with column names as keys
      for (const row of data) {
        if (Array.isArray(row)) {
          // Row is an array - map to headers
          const rowObj: Record<string, unknown> = {}
          headers.forEach((header, idx) => {
            rowObj[header] = row[idx]
          })
          allContactData.push(rowObj)
        } else if (row && typeof row === 'object') {
          // Row is already an object
          allContactData.push(row as Record<string, unknown>)
        }
        // Skip invalid rows silently
      }
    }

    // Get compatible contact sizes
    const compatibleSizes = getCompatibleContactSizes(
      sanitizedWireValue,
      wireSystem,
      allContactData
    )

    const responseData = {
      wireValue: sanitizedWireValue,
      wireSystem,
      catalogId: sanitizedCatalogId,
      contactSizes: compatibleSizes,
      totalSizes: compatibleSizes.length
    }

    // Store in cache
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Failed to get compatible contact sizes:', error)
    return NextResponse.json(
      { error: 'Failed to get compatible contact sizes' },
      { status: 500 }
    )
  }
}
