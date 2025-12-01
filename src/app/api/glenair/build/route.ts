import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildCompletePart, createDataFrame } from '@/lib/glenair'
import type { PartBuilderConfig, PartBuilderResult, Contact } from '@/types/glenair'

/**
 * POST /api/glenair/build
 * Build a complete Glenair part number
 * 
 * Request body: PartBuilderConfig
 */
export async function POST(request: NextRequest) {
  try {
    const body: PartBuilderConfig = await request.json()
    const {
      catalogId,
      projectId,
      wireSystem,
      wireValue,
      conductorCount,
      shellStyle,
      arrangement,
      contactSize,
      selectedContacts,
      save = false
    } = body

    // Validate required fields
    if (!catalogId) {
      return NextResponse.json(
        { error: 'catalogId is required' },
        { status: 400 }
      )
    }

    if (!wireSystem || !['AWG', 'MM2'].includes(wireSystem)) {
      return NextResponse.json(
        { error: 'wireSystem must be AWG or MM2' },
        { status: 400 }
      )
    }

    if (!wireValue) {
      return NextResponse.json(
        { error: 'wireValue is required' },
        { status: 400 }
      )
    }

    if (!conductorCount || conductorCount < 1) {
      return NextResponse.json(
        { error: 'conductorCount must be a positive number' },
        { status: 400 }
      )
    }

    if (!shellStyle) {
      return NextResponse.json(
        { error: 'shellStyle is required' },
        { status: 400 }
      )
    }

    if (!arrangement) {
      return NextResponse.json(
        { error: 'arrangement is required' },
        { status: 400 }
      )
    }

    if (!contactSize) {
      return NextResponse.json(
        { error: 'contactSize is required' },
        { status: 400 }
      )
    }

    if (!selectedContacts || !Array.isArray(selectedContacts) || selectedContacts.length === 0) {
      return NextResponse.json(
        { error: 'At least one contact must be selected' },
        { status: 400 }
      )
    }

    // Fetch catalog with PHM tables
    const catalog = await db.glenairCatalog.findUnique({
      where: { id: catalogId },
      include: {
        tables: {
          where: {
            type: 'phm'
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

    // Build PHM DataFrame
    const phmData: any[][] = []
    const phmColumns: string[] = []
    
    for (const table of catalog.tables) {
      const headers = table.headers as string[]
      const data = table.data as any[][]
      phmData.push(...data)
      if (phmColumns.length === 0) {
        phmColumns.push(...headers)
      }
    }

    const phmDf = createDataFrame(phmData, phmColumns)

    // Extract shell size from arrangement (e.g., "23-35" -> "23")
    const shellSize = arrangement.split('-')[0] || arrangement

    // Build the complete part
    const result = buildCompletePart(
      {
        catalogId,
        wireSystem,
        wireValue,
        conductorCount,
        shellStyle,
        arrangement,
        contactSize,
        selectedContacts
      },
      shellSize,
      phmDf.data,
      phmDf.columns
    )

    // Optionally save the configuration
    let savedConfigId: string | null = null
    if (save && projectId) {
      // Check if project exists
      const project = await db.bOMProject.findUnique({
        where: { id: projectId }
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      // Check for existing config with same arrangement and wire value
      const existingConfig = await db.glenairPartConfig.findFirst({
        where: {
          projectId,
          arrangement,
          wireValue
        }
      })

      if (existingConfig) {
        // Update existing
        const updated = await db.glenairPartConfig.update({
          where: { id: existingConfig.id },
          data: {
            wireSystem,
            conductorCount,
            shellStyle,
            contactSize,
            phmSize: result.phmSize,
            partNumber: result.partNumber,
            contacts: selectedContacts as any
          }
        })
        savedConfigId = updated.id
      } else {
        // Create new
        const created = await db.glenairPartConfig.create({
          data: {
            projectId,
            wireSystem,
            wireValue,
            conductorCount,
            shellStyle,
            arrangement,
            contactSize,
            phmSize: result.phmSize,
            partNumber: result.partNumber,
            contacts: selectedContacts as any
          }
        })
        savedConfigId = created.id
      }
    }

    const response: PartBuilderResult & { savedConfigId?: string } = {
      ...result,
      ...(savedConfigId && { savedConfigId })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to build Glenair part:', error)
    return NextResponse.json(
      { error: 'Failed to build part number' },
      { status: 500 }
    )
  }
}
