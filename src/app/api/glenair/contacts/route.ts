import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { findContactPartNumbers } from '@/lib/glenair/part-builder'
import { createDataFrame } from '@/lib/glenair/catalog-parser'
import type { WireSystem, ContactResult, Contact } from '@/types/glenair'

/**
 * GET /api/glenair/contacts
 * Look up compatible contacts based on wire value only
 * Returns ALL pins and sockets that are compatible with the specified wire size
 * 
 * Query params:
 * - wireValue: string (e.g., "12", "0.5")
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

    // Fetch catalog with pin and socket tables
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

    if (catalog.tables.length === 0) {
      return NextResponse.json(
        { error: 'No pin/socket tables found in catalog' },
        { status: 404 }
      )
    }

    // Separate pin and socket tables
    const pinTables = catalog.tables.filter(t => t.type === 'pin' || t.type === 'pin_socket')
    const socketTables = catalog.tables.filter(t => t.type === 'socket' || t.type === 'pin_socket')

    // Build DataFrames for pins and sockets
    const pinData: any[][] = []
    const pinColumns: string[] = []
    const socketData: any[][] = []
    const socketColumns: string[] = []

    for (const table of pinTables) {
      const headers = table.headers as string[]
      const data = table.data as any[][]
      pinData.push(...data)
      if (pinColumns.length === 0) {
        pinColumns.push(...headers)
      }
    }

    for (const table of socketTables) {
      const headers = table.headers as string[]
      const data = table.data as any[][]
      socketData.push(...data)
      if (socketColumns.length === 0) {
        socketColumns.push(...headers)
      }
    }

    const pinDf = createDataFrame(pinData, pinColumns)
    const socketDf = createDataFrame(socketData, socketColumns)

    // Find ALL compatible contacts for this wire size (no contact size filter)
    // We'll search through all contact sizes and return everything that fits the wire
    const allPins: Contact[] = []
    const allSockets: Contact[] = []

    // Get unique contact sizes from the data
    const contactSizes = new Set<string>()
    
    // Extract contact sizes from pin data
    for (const row of pinDf.data) {
      const sizeCol = pinDf.columns.find(c => 
        c.toLowerCase().includes('contact') && c.toLowerCase().includes('size')
      )
      if (sizeCol && row[sizeCol]) {
        contactSizes.add(String(row[sizeCol]).trim())
      }
    }

    // Also extract from socket data
    for (const row of socketDf.data) {
      const sizeCol = socketDf.columns.find(c => 
        c.toLowerCase().includes('contact') && c.toLowerCase().includes('size')
      )
      if (sizeCol && row[sizeCol]) {
        contactSizes.add(String(row[sizeCol]).trim())
      }
    }

    // Search for each contact size
    for (const contactSize of contactSizes) {
      const result = findContactPartNumbers(
        contactSize,
        wireValue,
        1, // Default quantity
        wireSystem,
        pinDf.data,
        pinDf.columns,
        socketDf.data,
        socketDf.columns
      )

      // Add contact size to each result
      allPins.push(...result.pins.map(p => ({
        part_number: p.part_number,
        contact_size: contactSize,
        awg_range: p.awg_range,
        mm2_range: p.mm2_range,
        quantity: 1,
        wire_system: wireSystem,
        type: 'pin' as const
      })))

      allSockets.push(...result.sockets.map(s => ({
        part_number: s.part_number,
        contact_size: contactSize,
        awg_range: s.awg_range,
        mm2_range: s.mm2_range,
        quantity: 1,
        wire_system: wireSystem,
        type: 'socket' as const
      })))
    }

    const response: ContactResult = {
      pins: allPins,
      sockets: allSockets
    }

    return NextResponse.json({
      wireValue,
      wireSystem,
      ...response,
      totalPins: response.pins.length,
      totalSockets: response.sockets.length
    })
  } catch (error) {
    console.error('Failed to lookup contacts:', error)
    return NextResponse.json(
      { error: 'Failed to lookup contacts' },
      { status: 500 }
    )
  }
}
