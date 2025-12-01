import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Contact } from '@/types/glenair'

interface AddToBomRequest {
  partConfigId?: string
  projectId: string
  locationId?: string
  // If partConfigId not provided, use these directly
  partNumber?: string
  selectedContacts?: Contact[]
  description?: string
}

/**
 * POST /api/glenair/add-to-bom
 * Add a Glenair part configuration to the BOM
 * 
 * Creates BOMItem for:
 * 1. The connector assembly (main part number)
 * 2. Each selected contact with appropriate quantities
 */
export async function POST(request: NextRequest) {
  try {
    const body: AddToBomRequest = await request.json()
    const { partConfigId, projectId, locationId, partNumber, selectedContacts, description } = body

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    if (!locationId) {
      return NextResponse.json(
        { error: 'locationId is required' },
        { status: 400 }
      )
    }

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

    // Verify location exists and belongs to project
    const location = await db.location.findFirst({
      where: {
        id: locationId,
        projectId
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found or does not belong to project' },
        { status: 404 }
      )
    }

    let connectorPartNumber: string
    let contacts: Contact[]
    let partDescription: string

    // Get part config either from ID or from request body
    if (partConfigId) {
      const config = await db.glenairPartConfig.findUnique({
        where: { id: partConfigId }
      })

      if (!config) {
        return NextResponse.json(
          { error: 'Part configuration not found' },
          { status: 404 }
        )
      }

      if (config.projectId !== projectId) {
        return NextResponse.json(
          { error: 'Part configuration does not belong to this project' },
          { status: 400 }
        )
      }

      connectorPartNumber = config.partNumber
      contacts = config.contacts as unknown as Contact[]
      partDescription = `Glenair Connector - ${config.arrangement} - ${config.wireValue} ${config.wireSystem}`
    } else {
      // Use directly provided values
      if (!partNumber) {
        return NextResponse.json(
          { error: 'Either partConfigId or partNumber is required' },
          { status: 400 }
        )
      }

      if (!selectedContacts || !Array.isArray(selectedContacts) || selectedContacts.length === 0) {
        return NextResponse.json(
          { error: 'selectedContacts is required when using partNumber' },
          { status: 400 }
        )
      }

      connectorPartNumber = partNumber
      contacts = selectedContacts
      partDescription = description || 'Glenair Connector Assembly'
    }

    // Create BOM items in a transaction
    const createdItems = await db.$transaction(async (tx) => {
      const items: any[] = []

      // 1. Create BOMItem for connector assembly
      const connectorItem = await tx.bOMItem.create({
        data: {
          projectId,
          locationId,
          partNumber: connectorPartNumber,
          description: partDescription,
          quantity: 1,
          unit: 'EA',
          manufacturer: 'Glenair'
        }
      })
      items.push(connectorItem)

      // 2. Create BOMItem for each contact type
      // Aggregate contacts by part number
      const contactAggregates = contacts.reduce((acc, contact) => {
        const key = contact.part_number
        if (!acc[key]) {
          acc[key] = {
            part_number: contact.part_number,
            type: contact.type,
            quantity: 0,
            awg_range: contact.awg_range,
            mm2_range: contact.mm2_range
          }
        }
        acc[key].quantity += contact.quantity
        return acc
      }, {} as Record<string, any>)

      for (const contactData of Object.values(contactAggregates)) {
        const contactItem = await tx.bOMItem.create({
          data: {
            projectId,
            locationId,
            partNumber: contactData.part_number,
            description: `Glenair ${contactData.type === 'pin' ? 'Pin' : 'Socket'} Contact (${contactData.awg_range || contactData.mm2_range || 'N/A'})`,
            quantity: contactData.quantity,
            unit: 'EA',
            manufacturer: 'Glenair'
          }
        })
        items.push(contactItem)
      }

      return items
    })

    return NextResponse.json({
      message: `Added ${createdItems.length} items to BOM`,
      items: createdItems.map(item => ({
        id: item.id,
        partNumber: item.partNumber,
        description: item.description,
        quantity: item.quantity
      })),
      connectorPartNumber,
      totalContacts: contacts.reduce((sum, c) => sum + c.quantity, 0)
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to add Glenair parts to BOM:', error)
    return NextResponse.json(
      { error: 'Failed to add parts to BOM' },
      { status: 500 }
    )
  }
}
