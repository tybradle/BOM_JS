import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  try {
    const { id, labelId } = await params
    const body = await request.json()
    
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

    // Get current label
    const currentLabel = await db.binLabel.findUnique({
      where: { id: labelId }
    })

    if (!currentLabel) {
      return NextResponse.json(
        { error: 'Label not found' },
        { status: 404 }
      )
    }

    // Prepare update data with computed fields
    const updateData: any = {
      ...body,
      updatedAt: new Date()
    }

    // Only recompute QR data if relevant fields changed
    const fieldsAffectingQR = ['kitString', 'buildingCode', 'rackNumber', 'category']
    const qrFieldsChanged = fieldsAffectingQR.some(field => 
      body[field] !== undefined && body[field] !== currentLabel[field as keyof typeof currentLabel]
    )

    if (qrFieldsChanged) {
      const kitString = body.kitString || currentLabel.kitString
      const buildingCode = body.buildingCode !== undefined ? body.buildingCode : currentLabel.buildingCode
      const rackNumber = body.rackNumber !== undefined ? body.rackNumber : currentLabel.rackNumber
      const category = body.category !== undefined ? body.category : currentLabel.category

      updateData.qrCodeData = generateQRData({
        projectNumber: project.projectNumber,
        kitString,
        buildingCode,
        rackNumber,
        category
      })

      updateData.binLocation = generateBinLocation(buildingCode, rackNumber)
      updateData.projectNumber = project.projectNumber
    }

    const updatedLabel = await db.binLabel.update({
      where: { id: labelId },
      data: updateData
    })

    return NextResponse.json(updatedLabel)
  } catch (error) {
    console.error('Failed to update label:', error)
    return NextResponse.json(
      { error: 'Failed to update label' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  try {
    const { labelId } = await params

    const deletedLabel = await db.binLabel.delete({
      where: { id: labelId }
    })

    return NextResponse.json({
      message: 'Label deleted successfully',
      deleted: deletedLabel
    })
  } catch (error) {
    console.error('Failed to delete label:', error)
    return NextResponse.json(
      { error: 'Failed to delete label' },
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
