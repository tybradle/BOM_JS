import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const manufacturer = searchParams.get('manufacturer')
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'relevance'

    // Build where clause for search
    const where: any = {}
    
    if (q) {
      where.OR = [
        { partNumber: { contains: q } },
        { description: { contains: q } },
        { manufacturer: { contains: q } },
      ]
    }

    if (manufacturer) {
      where.manufacturer = { contains: manufacturer }
    }

    if (category) {
      where.category = { contains: category }
    }

    // Get total count
    const total = await db.masterPart.count({ where })

    // Build orderBy clause
    let orderBy: any = { partNumber: 'asc' }
    if (sortBy === 'manufacturer') {
      orderBy = { manufacturer: 'asc' }
    } else if (sortBy === 'partNumber') {
      orderBy = { partNumber: 'asc' }
    }

    // Get paginated results
    const results = await db.masterPart.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      results,
      total,
      page,
      limit,
      hasMore: (page * limit) < total,
    })
  } catch (error) {
    console.error('Failed to search parts:', error)
    return NextResponse.json(
      { error: 'Failed to search parts' },
      { status: 500 }
    )
  }
}
