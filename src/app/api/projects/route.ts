import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Ensure we have a default user
    let defaultUser = await db.user.findFirst()
    
    if (!defaultUser) {
      defaultUser = await db.user.create({
        data: {
          email: 'demo@bom-framework.com',
          name: 'Demo User'
        }
      })
    }

    const projects = await db.bOMProject.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      projects,
      defaultUserId: defaultUser.id
    })
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectNumber, packageName, name, description, authorId } = body

    if (!projectNumber) {
      return NextResponse.json(
        { error: 'Project Number is required' },
        { status: 400 }
      )
    }

    if (!packageName) {
      return NextResponse.json(
        { error: 'Package Name is required' },
        { status: 400 }
      )
    }

    // Check if project number already exists
    const existingProject = await db.bOMProject.findUnique({
      where: { projectNumber }
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'Project Number already exists' },
        { status: 400 }
      )
    }

    // If no authorId provided, use or create default user
    let finalAuthorId = authorId
    if (!finalAuthorId) {
      let defaultUser = await db.user.findFirst()
      if (!defaultUser) {
        defaultUser = await db.user.create({
          data: {
            email: 'demo@bom-framework.com',
            name: 'Demo User'
          }
        })
      }
      finalAuthorId = defaultUser.id
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: finalAuthorId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid author ID' },
        { status: 400 }
      )
    }

    const project = await db.bOMProject.create({
      data: {
        projectNumber,
        packageName,
        name: name || `${projectNumber} - ${packageName}`,
        description,
        authorId: finalAuthorId,
        status: 'DRAFT',
        version: '1.0'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}