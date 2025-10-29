import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/parts/import
 * 
 * Import parts from uploaded data
 * This is a simplified version - full streaming XML parser to be implemented in Task 2.2/2.3
 * 
 * For now, accepts JSON array of parts for testing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { parts, clearExisting = false } = body

    if (!Array.isArray(parts)) {
      return NextResponse.json(
        { error: 'Parts must be an array' },
        { status: 400 }
      )
    }

    // Clear existing if requested
    if (clearExisting) {
      await db.masterPart.deleteMany()
    }

    // Import parts in batches
    const batchSize = 1000
    let imported = 0
    let updated = 0
    let errors = 0

    for (let i = 0; i < parts.length; i += batchSize) {
      const batch = parts.slice(i, i + batchSize)
      
      try {
        // Use upsert to handle duplicates
        for (const part of batch) {
          try {
            await db.masterPart.upsert({
              where: { partNumber: part.partNumber },
              update: {
                manufacturer: part.manufacturer,
                description: part.description,
                secondaryDescription: part.secondaryDescription,
                category: part.category,
                unitPrice: part.unitPrice ? parseFloat(part.unitPrice) : null,
                supplier: part.supplier,
                lastUpdated: new Date(),
              },
              create: {
                partNumber: part.partNumber,
                manufacturer: part.manufacturer,
                description: part.description,
                secondaryDescription: part.secondaryDescription,
                category: part.category,
                unitPrice: part.unitPrice ? parseFloat(part.unitPrice) : null,
                supplier: part.supplier,
              },
            })
            imported++
          } catch (err) {
            console.error(`Error importing part ${part.partNumber}:`, err)
            errors++
          }
        }
      } catch (batchError) {
        console.error('Batch import error:', batchError)
        errors += batch.length
      }
    }

    return NextResponse.json({
      success: true,
      totalParsed: parts.length,
      imported,
      updated,
      errors,
    })
  } catch (error) {
    console.error('Failed to import parts:', error)
    return NextResponse.json(
      { error: 'Failed to import parts' },
      { status: 500 }
    )
  }
}
