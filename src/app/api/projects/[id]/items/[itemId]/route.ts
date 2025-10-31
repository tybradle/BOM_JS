import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: projectId, itemId } = await params
    const body = await request.json()

    // Verify the item exists and belongs to this project
    const existingItem = await db.bOMItem.findFirst({
      where: {
        id: itemId,
        projectId
      }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'BOM item not found' },
        { status: 404 }
      )
    }

    // Update the item with provided fields
    const updatedItem = await db.bOMItem.update({
      where: { id: itemId },
      data: {
        ...(body.partNumber !== undefined && { partNumber: body.partNumber }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.secondaryDescription !== undefined && { secondaryDescription: body.secondaryDescription }),
        ...(body.quantity !== undefined && { quantity: parseFloat(body.quantity) }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.unitPrice !== undefined && { unitPrice: body.unitPrice ? parseFloat(body.unitPrice) : null }),
        ...(body.manufacturer !== undefined && { manufacturer: body.manufacturer }),
        ...(body.supplier !== undefined && { supplier: body.supplier }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.referenceDesignator !== undefined && { referenceDesignator: body.referenceDesignator }),
        ...(body.isSpare !== undefined && { isSpare: body.isSpare }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.order !== undefined && { order: body.order }),
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Failed to update BOM item:', error)
    return NextResponse.json(
      { error: 'Failed to update BOM item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: projectId, itemId } = await params

    // Verify the item exists and belongs to this project
    const existingItem = await db.bOMItem.findFirst({
      where: {
        id: itemId,
        projectId
      }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'BOM item not found' },
        { status: 404 }
      )
    }

    // Delete the item
    await db.bOMItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete BOM item:', error)
    return NextResponse.json(
      { error: 'Failed to delete BOM item' },
      { status: 500 }
    )
  }
}
