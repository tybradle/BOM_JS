import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categorizeTable } from '@/lib/glenair/catalog-parser'
import fs from 'fs'
import path from 'path'

const DEFAULT_CATALOG_PATH = path.join(process.cwd(), 'src/data/glenair/default-catalog.json')
const METADATA_PATH = path.join(process.cwd(), 'src/data/glenair/metadata.json')

/**
 * POST /api/glenair/seed
 * Seed the default Glenair catalog if it doesn't exist
 */
export async function POST() {
  try {
    // Check if default catalog already exists
    const existingCatalog = await db.glenairCatalog.findFirst({
      where: { name: 'Glenair Series 80' }
    })

    if (existingCatalog) {
      return NextResponse.json({
        success: false,
        message: 'Default catalog already exists',
        catalog: {
          id: existingCatalog.id,
          name: existingCatalog.name,
          version: existingCatalog.version,
          uploadedAt: existingCatalog.uploadedAt
        }
      })
    }

    // Read default catalog data
    if (!fs.existsSync(DEFAULT_CATALOG_PATH)) {
      return NextResponse.json(
        { error: 'Default catalog data not found' },
        { status: 404 }
      )
    }

    const catalogData = JSON.parse(fs.readFileSync(DEFAULT_CATALOG_PATH, 'utf8'))
    const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'))

    // Create catalog with tables in a transaction
    const catalog = await db.$transaction(async (tx) => {
      // Create catalog
      const newCatalog = await tx.glenairCatalog.create({
        data: {
          name: metadata.name,
          version: metadata.version
        }
      })

      // Create tables with auto-categorization
      const tableRecords = catalogData.tables.map((table) => {
        // Use type from data if available, otherwise auto-detect
        const type = table.type || categorizeTable(table.headers, undefined, table.page)
        
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

    return NextResponse.json({
      success: true,
      message: `Successfully seeded default catalog with ${createdCatalog!._count.tables} tables`,
      catalog: {
        id: createdCatalog!.id,
        name: createdCatalog!.name,
        version: createdCatalog!.version,
        uploadedAt: createdCatalog!.uploadedAt,
        tableCount: createdCatalog!._count.tables
      },
      metadata
    })

  } catch (error) {
    console.error('Failed to seed Glenair catalog:', error)
    return NextResponse.json(
      { error: 'Failed to seed catalog' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/glenair/seed
 * Reset the default catalog - deletes and re-seeds
 */
export async function DELETE() {
  try {
    // Find and delete existing default catalog
    const existingCatalog = await db.glenairCatalog.findFirst({
      where: { name: 'Glenair Series 80' }
    })

    if (existingCatalog) {
      await db.glenairCatalog.delete({
        where: { id: existingCatalog.id }
      })
    }

    // Read default catalog data
    if (!fs.existsSync(DEFAULT_CATALOG_PATH)) {
      return NextResponse.json(
        { error: 'Default catalog data not found' },
        { status: 404 }
      )
    }

    const catalogData = JSON.parse(fs.readFileSync(DEFAULT_CATALOG_PATH, 'utf8'))
    const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'))

    // Create catalog with tables in a transaction
    const catalog = await db.$transaction(async (tx) => {
      const newCatalog = await tx.glenairCatalog.create({
        data: {
          name: metadata.name,
          version: metadata.version
        }
      })

      const tableRecords = catalogData.tables.map((table: any) => {
        const type = table.type || categorizeTable(table.headers, undefined, table.page)
        
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

    const createdCatalog = await db.glenairCatalog.findUnique({
      where: { id: catalog.id },
      include: {
        _count: {
          select: { tables: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Reset default catalog with ${createdCatalog!._count.tables} tables`,
      catalog: {
        id: createdCatalog!.id,
        name: createdCatalog!.name,
        version: createdCatalog!.version,
        uploadedAt: createdCatalog!.uploadedAt,
        tableCount: createdCatalog!._count.tables
      }
    })

  } catch (error) {
    console.error('Failed to reset Glenair catalog:', error)
    return NextResponse.json(
      { error: 'Failed to reset catalog' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/glenair/seed
 * Check if default catalog exists and return metadata
 */
export async function GET() {
  try {
    // Check if default catalog exists
    const existingCatalog = await db.glenairCatalog.findFirst({
      where: { name: 'Glenair Series 80' },
      include: {
        _count: {
          select: { tables: true }
        }
      }
    })

    const metadata = fs.existsSync(METADATA_PATH) 
      ? JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'))
      : null

    return NextResponse.json({
      exists: !!existingCatalog,
      catalog: existingCatalog ? {
        id: existingCatalog.id,
        name: existingCatalog.name,
        version: existingCatalog.version,
        uploadedAt: existingCatalog.uploadedAt,
        tableCount: existingCatalog._count.tables
      } : null,
      metadata
    })

  } catch (error) {
    console.error('Failed to check catalog seed status:', error)
    return NextResponse.json(
      { error: 'Failed to check catalog status' },
      { status: 500 }
    )
  }
}