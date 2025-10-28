import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    
    const locations = await db.location.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Failed to fetch locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
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
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      )
    }

    // Check if location name already exists in this project
    const existingLocation = await db.location.findFirst({
      where: {
        projectId,
        name: name.trim()
      }
    })

    if (existingLocation) {
      return NextResponse.json(
        { error: 'Location name already exists in this project' },
        { status: 400 }
      )
    }

    // Get the next order value
    const maxOrder = await db.location.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' }
    })

    const nextOrder = maxOrder ? maxOrder.order + 1 : 0

    const location = await db.location.create({
      data: {
        name: name.trim(),
        order: nextOrder,
        projectId
      },
      include: {
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Failed to create location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}