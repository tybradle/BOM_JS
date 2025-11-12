import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const locationId = url.searchParams.get('locationId')

    const labels = await db.binLabel.findMany({
      where: {
        projectId: id,
        ...(locationId && { locationId })
      },
      include: {
        project: {
          select: {
            projectNumber: true,
            packageName: true
          }
        },
        location: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(labels)
  } catch (error) {
    console.error('Failed to fetch labels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { locationId, kitString, buildingCode, rackNumber, category, description, buildQty } = body

    // Get project details for QR code generation
    const project = await db.bOMProject.findUnique({
      where: { id },
      select: {
        projectNumber: true,
        packageName: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Generate QR code data
    const qrCodeData = generateQRData({
      projectNumber: project.projectNumber,
      kitString,
      buildingCode,
      rackNumber,
      category
    })

    // Generate bin location string
    const binLocation = generateBinLocation(buildingCode, rackNumber)

    const label = await db.binLabel.create({
      data: {
        projectId: id,
        locationId,
        projectNumber: project.projectNumber,
        kitString,
        description,
        buildQty: buildQty || 1,
        buildingCode,
        rackNumber,
        category,
        qrCodeData,
        binLocation
      }
    })

    return NextResponse.json(label, { status: 201 })
  } catch (error) {
    console.error('Failed to create label:', error)
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    )
  }
}

function generateQRData({
  projectNumber,
  kitString,
  buildingCode,
  rackNumber,
  category
}: {
  projectNumber: string
  kitString: string
  buildingCode: string
  rackNumber: string
  category: 'Panel' | 'Field'
}): string {
  // Split kit string: "Z2_EC1" → ["Z2", "EC1"]
  const [packageName, locationName] = kitString.split('_')
  
  // Extract numeric only from package
  const packageNum = (packageName || '').replace(/\D/g, '') || '0'
  
  // Category code
  const categoryCode = category === 'Panel' ? 'E' : 'F'
  
  // Extract location number (trailing digits) or default to 1
  const locationMatch = (locationName || '').match(/(\d+)$/)
  const locationNum = locationMatch ? locationMatch[1] : '1'
  
  // Build QR string: B{building}-{rack}-{packageNum}-{category}{locationNum}
  return `B${buildingCode}-${rackNumber}-${packageNum}-${categoryCode}${locationNum}`
}

function generateBinLocation(buildingCode: string, rackNumber: string): string {
  return `Building ${buildingCode} / Bin ${rackNumber}`
}
