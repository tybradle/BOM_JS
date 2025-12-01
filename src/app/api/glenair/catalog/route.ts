import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categorizeTable } from '@/lib/glenair/catalog-parser'
import type { CatalogUploadRequest, CatalogUploadResponse } from '@/types/glenair'

/**
 * GET /api/glenair/catalog
 * List all Glenair catalogs with table counts
 */
export async function GET() {
  try {
    const catalogs = await db.glenairCatalog.findMany({
      include: {
        _count: {
          select: {
            tables: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    return NextResponse.json({
      catalogs: catalogs.map(c => ({
        id: c.id,
        name: c.name,
        version: c.version,
        uploadedAt: c.uploadedAt,
        tableCount: c._count.tables
      }))
    })
  } catch (error) {
    console.error('Failed to fetch Glenair catalogs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalogs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/glenair/catalog
 * Upload and parse validated JSON tables
 * 
 * Request body:
 * {
 *   name: string,
 *   version: string,
 *   tables: Array<{ page: number, headers: string[], data: any[][], type?: string }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CatalogUploadRequest = await request.json()
    const { name, version, tables } = body

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Catalog name is required' },
        { status: 400 }
      )
    }

    if (!version || typeof version !== 'string') {
      return NextResponse.json(
        { error: 'Catalog version is required' },
        { status: 400 }
      )
    }

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json(
        { error: 'At least one table is required' },
        { status: 400 }
      )
    }

    // Validate table structure
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]
      if (!table.headers || !Array.isArray(table.headers)) {
        return NextResponse.json(
          { error: `Table ${i + 1} is missing headers array` },
          { status: 400 }
        )
      }
      if (!table.data || !Array.isArray(table.data)) {
        return NextResponse.json(
          { error: `Table ${i + 1} is missing data array` },
          { status: 400 }
        )
      }
      if (typeof table.page !== 'number') {
        return NextResponse.json(
          { error: `Table ${i + 1} is missing page number` },
          { status: 400 }
        )
      }
    }

    // Create catalog with tables in a transaction
    const catalog = await db.$transaction(async (tx) => {
      // Create catalog
      const newCatalog = await tx.glenairCatalog.create({
        data: {
          name,
          version
        }
      })

      // Create tables with auto-categorization
      const tableRecords = tables.map((table) => {
        // Auto-detect type if not provided
        const type = table.type || categorizeTable(table.headers, table.page)
        
        return {
          catalogId: newCatalog.id,
          type,
          page: table.page,
          headers: table.headers,
          data: table.data
        }
      })

      await tx.glenairTable.createMany({
        data: tableRecords
      })

      return newCatalog
    })

    // Fetch complete catalog with table count
    const createdCatalog = await db.glenairCatalog.findUnique({
      where: { id: catalog.id },
      include: {
        _count: {
          select: { tables: true }
        }
      }
    })

    const response: CatalogUploadResponse = {
      catalog: {
        id: createdCatalog!.id,
        name: createdCatalog!.name,
        version: createdCatalog!.version,
        uploadedAt: createdCatalog!.uploadedAt,
        tables: []
      },
      tableCount: createdCatalog!._count.tables,
      message: `Successfully uploaded catalog with ${createdCatalog!._count.tables} tables`
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Failed to upload Glenair catalog:', error)
    return NextResponse.json(
      { error: 'Failed to upload catalog' },
      { status: 500 }
    )
  }
}
