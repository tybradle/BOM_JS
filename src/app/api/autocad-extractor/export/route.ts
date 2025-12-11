// API route for Excel export
import { NextRequest, NextResponse } from 'next/server'
import { generateExcelWorkbook } from '@/lib/autocad-extractor/excel-generator'
import type { BOMItem } from '@/lib/autocad-extractor/types'

export async function POST(request: NextRequest) {
  try {
    const { items, fileName } = await request.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid items data' },
        { status: 400 }
      )
    }

    // Generate Excel workbook
    const buffer = await generateExcelWorkbook(items as BOMItem[], fileName || 'BOM')

    // Return as downloadable file
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName || 'BOM'}.xlsx"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
