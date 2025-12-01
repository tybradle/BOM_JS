import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type RouteParams = Promise<{ catalogId: string }>

/**
 * GET /api/glenair/catalog/[catalogId]
 * Fetch catalog with all tables
 */
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { catalogId } = await params

    const catalog = await db.glenairCatalog.findUnique({
      where: { id: catalogId },
      include: {
        tables: {
          orderBy: [
            { type: 'asc' },
            { page: 'asc' }
          ]
        }
      }
    })

    if (!catalog) {
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      )
    }

    // Group tables by type for easier consumption
    const tablesByType = catalog.tables.reduce((acc, table) => {
      if (!acc[table.type]) {
        acc[table.type] = []
      }
      acc[table.type].push({
        id: table.id,
        page: table.page,
        headers: table.headers,
        data: table.data,
        rowCount: Array.isArray(table.data) ? (table.data as any[]).length : 0
      })
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      id: catalog.id,
      name: catalog.name,
      version: catalog.version,
      uploadedAt: catalog.uploadedAt,
      tableCount: catalog.tables.length,
      tablesByType
    })
  } catch (error) {
    console.error('Failed to fetch Glenair catalog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalog' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/glenair/catalog/[catalogId]
 * Remove catalog and cascade delete tables
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { catalogId } = await params

    // Check if catalog exists
    const catalog = await db.glenairCatalog.findUnique({
      where: { id: catalogId }
    })

    if (!catalog) {
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      )
    }

    // Delete catalog (tables will cascade delete due to schema)
    await db.glenairCatalog.delete({
      where: { id: catalogId }
    })

    return NextResponse.json({
      message: `Catalog "${catalog.name}" deleted successfully`
    })
  } catch (error) {
    console.error('Failed to delete Glenair catalog:', error)
    return NextResponse.json(
      { error: 'Failed to delete catalog' },
      { status: 500 }
    )
  }
}
