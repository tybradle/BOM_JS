import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { format } = body

    if (!format) {
      return NextResponse.json(
        { error: 'Export format is required' },
        { status: 400 }
      )
    }

    // Get project details
    const project = await db.bOMProject.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    let content = ''
    let filename = ''

    if (format === 'XML') {
      content = generateEplanXML(project)
      filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_BOM.xml`
    } else if (format === 'JSON') {
      content = JSON.stringify(project, null, 2)
      filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_BOM.json`
    } else if (format === 'CSV') {
      content = generateCSV(project.items)
      filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_BOM.csv`
    } else {
      return NextResponse.json(
        { error: 'Unsupported export format' },
        { status: 400 }
      )
    }

    // Save export record
    const exportRecord = await db.bOMExport.create({
      data: {
        filename,
        format: format.toUpperCase(),
        content,
        version: project.version,
        projectId: id
      }
    })

    return NextResponse.json({
      id: exportRecord.id,
      filename,
      content,
      format: format.toUpperCase(),
      exportedAt: exportRecord.exportedAt
    })
  } catch (error) {
    console.error('Failed to export BOM:', error)
    return NextResponse.json(
      { error: 'Failed to export BOM' },
      { status: 500 }
    )
  }
}

function generateEplanXML(project: any): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<EPLAN xmlns="http://www.eplan.de/EPLAN" version="2.7">
  <Project>
    <Properties>
      <Name>${project.name}</Name>
      <Description>${project.description || ''}</Description>
      <Version>${project.version}</Version>
      <Created>${project.createdAt}</Created>
      <Modified>${project.updatedAt}</Modified>
    </Properties>
    <Parts>`

  const partsXML = project.items.map((item: any, index: number) => `      <Part id="${index + 1}">
        <PartNumber>${item.partNumber}</PartNumber>
        <Description>${item.description}</Description>
        <Quantity>${item.quantity}</Quantity>
        <Unit>${item.unit}</Unit>
        <Manufacturer>${item.manufacturer || ''}</Manufacturer>
        <Supplier>${item.supplier || ''}</Supplier>
        <Category>${item.category || ''}</Category>
        <Status>${item.status}</Status>
      </Part>`).join('\n')

  const xmlFooter = `
    </Parts>
  </Project>
</EPLAN>`

  return xmlHeader + partsXML + xmlFooter
}

function generateCSV(items: any[]): string {
  const headers = ['Part Number', 'Description', 'Quantity', 'Unit', 'Manufacturer', 'Supplier', 'Category', 'Status']
  const csvContent = [
    headers.join(','),
    ...items.map(item => [
      item.partNumber,
      `"${item.description}"`,
      item.quantity,
      item.unit,
      item.manufacturer || '',
      item.supplier || '',
      item.category || '',
      item.status
    ].join(','))
  ].join('\n')

  return csvContent
}