import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Batch create parts in MasterPart database
 * POST /api/parts/batch-create
 * Body: { parts: PartToAdd[], source?: string }
 * Returns: { created: number, skipped: number, errors: string[] }
 */

interface PartToAdd {
  partNumber: string
  manufacturer: string
  description: string
  secondaryDescription?: string | null
  category?: string | null
  unitPrice?: number | null
  currency?: string | null
  supplier?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { parts, source = 'bom-import' } = body

    if (!parts || !Array.isArray(parts)) {
      return NextResponse.json(
        { error: 'parts array is required' },
        { status: 400 }
      )
    }

    if (parts.length === 0) {
      return NextResponse.json({
        created: 0,
        skipped: 0,
        errors: []
      })
    }

    const created: string[] = []
    const skipped: string[] = []
    const errors: string[] = []

    // Process each part individually for better error handling
    for (const part of parts) {
      try {
        // Validate required fields
        const validationErrors = validatePartData(part)
        if (validationErrors.length > 0) {
          errors.push(`${part.partNumber || 'unknown'}: ${validationErrors.join(', ')}`)
          continue
        }

        // Check if part already exists
        const existing = await db.masterPart.findUnique({
          where: { partNumber: part.partNumber }
        })

        if (existing) {
          skipped.push(part.partNumber)
          continue
        }

        // Create new part
        await db.masterPart.create({
          data: {
            partNumber: part.partNumber,
            manufacturer: part.manufacturer,
            description: part.description,
            secondaryDescription: part.secondaryDescription || null,
            category: part.category || null,
            unitPrice: part.unitPrice || null,
            currency: part.currency || null,
            supplier: part.supplier || null,
            source,
            importDate: new Date()
          }
        })

        created.push(part.partNumber)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${part.partNumber}: ${errorMessage}`)
      }
    }

    return NextResponse.json({
      created: created.length,
      skipped: skipped.length,
      errors,
      createdParts: created,
      skippedParts: skipped
    })

  } catch (error) {
    console.error('Failed to batch create parts:', error)
    return NextResponse.json(
      { 
        error: 'Failed to batch create parts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Validate part data before database insert
 */
function validatePartData(part: PartToAdd): string[] {
  const errors: string[] = []

  if (!part.partNumber || part.partNumber.trim() === '') {
    errors.push('Part number is required')
  }

  if (!part.manufacturer || part.manufacturer.trim() === '') {
    errors.push('Manufacturer is required')
  }

  if (!part.description || part.description.trim() === '') {
    errors.push('Description is required')
  }

  if (part.unitPrice !== undefined && part.unitPrice !== null && part.unitPrice < 0) {
    errors.push('Unit price must be positive')
  }

  return errors
}
