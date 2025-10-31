import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    const items = await db.bOMItem.findMany({
      where: {
        projectId,
        ...(locationId && { locationId })
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Failed to fetch BOM items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch BOM items' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const {
      partNumber,
      description,
      quantity,
      unit,
      manufacturer,
      supplier,
      category,
      locationId,
      forceCreate = false // Allow bypassing duplicate check
    } = body

    if (!partNumber || !description || !quantity || !unit) {
      return NextResponse.json(
        { error: 'Part number, description, quantity, and unit are required' },
        { status: 400 }
      )
    }

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      )
    }

    // Check if part number already exists in this location
    const existingItem = await db.bOMItem.findFirst({
      where: {
        projectId,
        locationId,
        partNumber: partNumber.trim()
      }
    })

    // If duplicate found and not forcing creation, return duplicate warning
    if (existingItem && !forceCreate) {
      return NextResponse.json(
        {
          duplicate: true,
          existingItem: {
            id: existingItem.id,
            partNumber: existingItem.partNumber,
            description: existingItem.description,
            quantity: existingItem.quantity,
            manufacturer: existingItem.manufacturer,
            unitPrice: existingItem.unitPrice
          },
          message: 'This part number already exists in this location'
        },
        { status: 409 } // Conflict status code
      )
    }

    // Get the highest order value for this location
    const lastItem = await db.bOMItem.findFirst({
      where: { 
        projectId,
        locationId 
      },
      orderBy: { order: 'desc' }
    })

    const item = await db.bOMItem.create({
      data: {
        partNumber: partNumber.trim(),
        description: description.trim(),
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        manufacturer: manufacturer?.trim(),
        supplier: supplier?.trim(),
        category: category?.trim(),
        projectId,
        locationId,
        status: 'ACTIVE',
        order: (lastItem?.order || 0) + 1
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Failed to create BOM item:', error)
    return NextResponse.json(
      { error: 'Failed to create BOM item' },
      { status: 500 }
    )
  }
}