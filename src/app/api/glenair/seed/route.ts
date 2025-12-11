import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categorizeTable } from '@/lib/glenair/catalog-parser'
import fs from 'fs'
import path from 'path'

// Legacy path (kept for backward compatibility)
const DEFAULT_CATALOG_PATH = path.join(process.cwd(), 'src/data/glenair/default-catalog.json')
const METADATA_PATH = path.join(process.cwd(), 'src/data/glenair/metadata.json')

// Split catalog paths (preferred - more efficient)
const CATALOG_FILES = {
  arrangements: {
    data: path.join(process.cwd(), 'src/data/glenair/arrangements.json'),
    metadata: path.join(process.cwd(), 'src/data/glenair/arrangements-metadata.json')
  },
  phm: {
    data: path.join(process.cwd(), 'src/data/glenair/phm.json'),
    metadata: path.join(process.cwd(), 'src/data/glenair/phm-metadata.json')
  },
  pins: {
    data: path.join(process.cwd(), 'src/data/glenair/pins.json'),
    metadata: path.join(process.cwd(), 'src/data/glenair/pins-metadata.json')
  },
  sockets: {
    data: path.join(process.cwd(), 'src/data/glenair/sockets.json'),
    metadata: path.join(process.cwd(), 'src/data/glenair/sockets-metadata.json')
  }
}

/**
 * Load catalog data from split files (more efficient than single large file)
 */
function loadCatalogData(): { tables: any[], metadata: any } {
  const allTables: any[] = []
  let primaryMetadata: any = null

  // Try to load from split files first (preferred)
  const splitFilesExist = Object.values(CATALOG_FILES).every(({ data }) => fs.existsSync(data))
  
  if (splitFilesExist) {
    // Load from split files
    Object.entries(CATALOG_FILES).forEach(([_category, paths]) => {
      const categoryData = JSON.parse(fs.readFileSync(paths.data, 'utf8'))
      const categoryMetadata = JSON.parse(fs.readFileSync(paths.metadata, 'utf8'))
      
      // Combine tables
      if (categoryData.tables && Array.isArray(categoryData.tables)) {
        allTables.push(...categoryData.tables)
      }
      
      // Use first metadata as primary (arrangements)
      if (!primaryMetadata) {
        primaryMetadata = {
          name: 'Glenair Series 80',
          version: categoryMetadata.version,
          description: 'Glenair connector catalog with contact arrangements, pin/socket specifications, and wire compatibility data',
          source: 'Glenair Extractor - Split catalog files',
          transformedAt: categoryMetadata.transformedAt,
          tableCount: 0, // Will be calculated
          format: categoryMetadata.format
        }
      }
    })
    
    primaryMetadata.tableCount = allTables.length
    
    return { tables: allTables, metadata: primaryMetadata }
  }
  
  // Fallback to legacy single file
  if (fs.existsSync(DEFAULT_CATALOG_PATH)) {
    const catalogData = JSON.parse(fs.readFileSync(DEFAULT_CATALOG_PATH, 'utf8'))
    const metadata = fs.existsSync(METADATA_PATH) 
      ? JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'))
      : { name: 'Glenair Series 80', version: '2024.1' }
    
    return { tables: catalogData.tables || [], metadata }
  }
  
  throw new Error('No catalog data found (neither split files nor legacy file)')
}

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

    // Read catalog data (from split files or legacy file)
    let catalogData: { tables: any[] }
    let metadata: any
    
    try {
      const loaded = loadCatalogData()
      catalogData = { tables: loaded.tables }
      metadata = loaded.metadata
    } catch (error) {
      return NextResponse.json(
        { error: 'Default catalog data not found' },
        { status: 404 }
      )
    }

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
      const tableRecords = catalogData.tables.map((table: any) => {
        // Always use categorizeTable to normalize type (raw JSON types like "Contact Arrangements" don't match expected types like "arrangement")
        const type = categorizeTable(table.headers, table.type, table.page)
        
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

    // Read catalog data (from split files or legacy file)
    let catalogData: { tables: any[] }
    let metadata: any
    
    try {
      const loaded = loadCatalogData()
      catalogData = { tables: loaded.tables }
      metadata = loaded.metadata
    } catch (error) {
      return NextResponse.json(
        { error: 'Default catalog data not found' },
        { status: 404 }
      )
    }

    // Create catalog with tables in a transaction
    const catalog = await db.$transaction(async (tx) => {
      const newCatalog = await tx.glenairCatalog.create({
        data: {
          name: metadata.name,
          version: metadata.version
        }
      })

      const tableRecords = catalogData.tables.map((table: any) => {
        // Always use categorizeTable to normalize type (raw JSON types like "Contact Arrangements" don't match expected types like "arrangement")
        const type = categorizeTable(table.headers, table.type, table.page)
        
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

    // Try to load metadata from split files or legacy file
    let metadata: any = null
    try {
      const loaded = loadCatalogData()
      metadata = loaded.metadata
    } catch (error) {
      // Fallback to legacy metadata file
      if (fs.existsSync(METADATA_PATH)) {
        metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'))
      }
    }

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
