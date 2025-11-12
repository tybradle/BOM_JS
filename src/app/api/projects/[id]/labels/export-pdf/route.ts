import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { labelIds = [] } = body

    // Get labels to export
    const labels = await db.binLabel.findMany({
      where: {
        projectId: id,
        ...(labelIds.length > 0 && { id: { in: labelIds } })
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (labels.length === 0) {
      return NextResponse.json(
        { error: 'No labels to export' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBuffer = await generateLabelPDF(labels)
    
    // Return as base64 for client download
    const base64 = pdfBuffer.toString('base64')
    const filename = `${labels[0]?.projectNumber || 'labels'}_bin_labels.pdf`

    return NextResponse.json({
      content: base64,
      filename,
      contentType: 'application/pdf'
    })
  } catch (error) {
    console.error('Failed to export PDF:', error)
    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    )
  }
}

async function generateLabelPDF(labels: any[]): Promise<Buffer> {
  const doc = new jsPDF({
    unit: 'in',
    format: [4, 6], // 4" x 6" thermal label
    orientation: 'portrait'
  })
  
  // Set font
  doc.setFont('helvetica')
  doc.setFontSize(10)

  for (let i = 0; i < labels.length; i++) {
    if (i > 0) doc.addPage()
    
    const label = labels[i]
    const y = 0.25 // Start 0.25" from top

    // Project (bold 10pt)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`Project: ${label.projectNumber}`, 0.25, y)

    // Kit (bold 10pt)
    const kitY = y + 0.35
    doc.text(`Kit: ${label.kitString}`, 0.25, kitY)

    // Description (regular 9pt)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const descY = y + 0.70
    const description = label.description.length > 30 
      ? label.description.substring(0, 27) + '...' 
      : label.description
    doc.text(`Desc: ${description}`, 0.25, descY)

    // Build QTY (regular 9pt)
    const qtyY = y + 1.05
    doc.text(`Build QTY: ${label.buildQty}`, 0.25, qtyY)

    // QR Code (center at 2" from top)
    const qrY = y + 2.0
    const qrX = 1.0 // Center horizontally (4" total / 2 - 2" QR / 2)
    const qrSize = 2.0 // 2" square

    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(label.qrCodeData, {
      width: Math.floor(qrSize * 72), // Convert inches to points at 72 DPI
      margin: 0,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    // Add QR code to PDF
    doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize)

    // QR Text below (8pt monospace, centered)
    doc.setFont('courier', 'normal')
    doc.setFontSize(8)
    const qrTextY = qrY + qrSize + 0.25
    doc.text(label.qrCodeData, 2.0, qrTextY, { align: 'center' })

    // Bin Location (bold 9pt, centered)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    const binLocY = y + 4.75
    doc.text(`Bin Location: ${label.binLocation}`, 2.0, binLocY, { align: 'center' })
  }

  // Convert to buffer
  return Buffer.from(doc.output('arraybuffer'))
}
