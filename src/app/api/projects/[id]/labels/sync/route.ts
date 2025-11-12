import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get project details with locations
    const project = await db.bOMProject.findUnique({
      where: { id },
      include: {
        locations: {
          where: {
            items: {
              some: {} // Only locations with items
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get existing labels for this project
    const existingLabels = await db.binLabel.findMany({
      where: { projectId: id },
      select: { kitString: true }
    })
    const existingKitStrings = new Set(existingLabels.map(label => label.kitString))

    // Create labels for locations that don't have them yet
    const newLabels: any[] = []
    for (const location of project.locations) {
      const kitString = `${project.packageName}_${location.name}`
      
      if (!existingKitStrings.has(kitString)) {
        // Generate QR code data (will be empty for user to fill)
        const qrCodeData = generateQRData({
          projectNumber: project.projectNumber,
          kitString,
          buildingCode: '', // User fills
          rackNumber: '',  // User fills
          category: 'Panel' // Default
        })

        // Generate bin location string
        const binLocation = generateBinLocation('', '')

        const labelData = {
          projectId: id,
          locationId: location.id,
          projectNumber: project.projectNumber,
          kitString,
          description: '', // User fills
          buildQty: 1, // Default
          buildingCode: '', // User fills
          rackNumber: '', // User fills
          category: 'Panel', // Default
          qrCodeData,
          binLocation
        }

        newLabels.push(labelData)
      }
    }

    // Create all new labels in a transaction
    if (newLabels.length > 0) {
      await db.binLabel.createMany({
        data: newLabels as any
      })
    }

    return NextResponse.json({
      message: `Synced ${newLabels.length} new locations from project`,
      created: newLabels.length,
      skipped: existingLabels.length
    })
  } catch (error) {
    console.error('Failed to sync labels:', error)
    return NextResponse.json(
      { error: 'Failed to sync labels' },
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
  // For empty building/rack, use placeholders
  const building = buildingCode || '0'
  const rack = rackNumber || '0'
  
  return `B${building}-${rack}-${packageNum}-${categoryCode}${locationNum}`
}

function generateBinLocation(buildingCode: string, rackNumber: string): string {
  if (!buildingCode && !rackNumber) {
    return 'Building  / Bin '
  }
  return `Building ${buildingCode} / Bin ${rackNumber}`
}
