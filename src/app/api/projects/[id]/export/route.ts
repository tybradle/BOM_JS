import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { format = 'EPLAN' } = body // Default to EPLAN format

    // Get project details with locations and items
    const project = await db.bOMProject.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            items: {
              orderBy: { order: 'asc' }
            }
          },
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

    if (format === 'EPLAN' || format === 'XML') {
      content = generateEplanXML(project)
      // Filename format: {projectNumber}_{locationName}_{version}.xml
      const primaryLocation = project.locations[0]?.name || 'BOM'
      filename = `${project.projectNumber}_${primaryLocation.replace(/[^a-zA-Z0-9]/g, '_')}_${project.version}.xml`
    } else if (format === 'JSON') {
      content = JSON.stringify(project, null, 2)
      filename = `${project.projectNumber}_BOM.json`
    } else if (format === 'CSV') {
      // Flatten all items from all locations
      const allItems = project.locations.flatMap(loc => loc.items)
      content = generateCSV(allItems)
      filename = `${project.projectNumber}_BOM.csv`
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
        format: format.toUpperCase() === 'XML' ? 'EPLAN' : format.toUpperCase(),
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
  // Eplan XML format based on sample: 14247_Z2_MAIN_1.xml
  // Project → Package → KittingLocation(s) → Parts
  
  const primaryLocation = project.locations[0]?.name || 'MAIN'
  const projectName = `${project.projectNumber}_${primaryLocation}_${project.version || '1'}`
  
  const xmlHeader = `<?xml version="1.0" encoding="utf-8"?>
<Project Name="${escapeXml(projectName)}">`

  const packageXML = `
  <Package Name="${escapeXml(project.packageName)}">`

  // Generate KittingLocation elements for each location with items
  const locationsXML = project.locations
    .filter((location: any) => location.items && location.items.length > 0)
    .map((location: any) => {
      const locationName = location.exportName || location.name
      const partsXML = location.items.map((item: any) => generatePartXML(item)).join('\n')
      
      return `    <KittingLocation Name="${escapeXml(locationName)}">
${partsXML}
    </KittingLocation>`
    }).join('\n')

  const xmlFooter = `
  </Package>
</Project>`

  return xmlHeader + packageXML + '\n' + locationsXML + xmlFooter
}

function generatePartXML(item: any): string {
  // Map BOMItem fields to Eplan P_ARTICLE fields
  return `      <Part>
        <P_ARTICLE_MANUFACTURER>${escapeXml(item.manufacturer || '')}</P_ARTICLE_MANUFACTURER>
        <P_ARTICLE_DESCR1>${escapeXml(item.description)}</P_ARTICLE_DESCR1>
        <P_ARTICLE_DESCR2>${escapeXml(item.secondaryDescription || item.category || '')}</P_ARTICLE_DESCR2>
        <P_ARTICLE_ORDERNR>${escapeXml(item.partNumber)}</P_ARTICLE_ORDERNR>
        <P_ARTICLE_DEVTAG>${escapeXml(item.referenceDesignator || '')}</P_ARTICLE_DEVTAG>
        <P_ARTICLE_QUANTITY_IN_PROJECT_UNIT>${item.quantity}</P_ARTICLE_QUANTITY_IN_PROJECT_UNIT>
        <P_ARTICLE_SALESPRICE_1>${item.unitPrice !== null && item.unitPrice !== undefined ? item.unitPrice : ''}</P_ARTICLE_SALESPRICE_1>
        <P_ARTICLE_SPARE>${item.isSpare ? '1' : '0'}</P_ARTICLE_SPARE>
      </Part>`
}

function escapeXml(str: string): string {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
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