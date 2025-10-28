import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, items, format } = body

    if (!projectId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Project ID and items array are required' },
        { status: 400 }
      )
    }

    // Get the highest order value for this project
    const lastItem = await db.bOMItem.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' }
    })

    let startOrder = (lastItem?.order || 0) + 1

    const createdItems = await Promise.all(
      items.map((item, index) => 
        db.bOMItem.create({
          data: {
            partNumber: item.partNumber,
            description: item.description,
            quantity: parseFloat(item.quantity) || 1,
            unit: item.unit || 'PCS',
            manufacturer: item.manufacturer,
            supplier: item.supplier,
            category: item.category,
            projectId,
            status: 'ACTIVE',
            order: startOrder + index
          }
        })
      )
    )

    return NextResponse.json({
      message: `Successfully imported ${createdItems.length} items`,
      items: createdItems
    })
  } catch (error) {
    console.error('Failed to import BOM items:', error)
    return NextResponse.json(
      { error: 'Failed to import BOM items' },
      { status: 500 }
    )
  }
}