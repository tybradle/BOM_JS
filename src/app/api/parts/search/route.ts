import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCachedSearch, setCachedSearch, generateCacheKey } from '@/lib/search-cache'
import { performanceMonitor } from '@/lib/performance-monitor'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const manufacturer = searchParams.get('manufacturer')
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'relevance'

    // Generate cache key
    const cacheKey = generateCacheKey({
      query: q,
      page,
      limit,
      manufacturer: manufacturer || undefined,
      category: category || undefined,
    })

    // Check cache first
    const cached = getCachedSearch(cacheKey)
    if (cached) {
      performanceMonitor.recordCacheHit()
      return NextResponse.json(cached)
    }

    performanceMonitor.recordCacheMiss()

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

    // Perform database queries with performance monitoring
    const [total, results] = await performanceMonitor.measureQuery(
      'parts-search',
      async () => {
        const countPromise = db.masterPart.count({ where })
        
        // Build orderBy clause
        let orderBy: any = { partNumber: 'asc' }
        if (sortBy === 'manufacturer') {
          orderBy = { manufacturer: 'asc' }
        } else if (sortBy === 'partNumber') {
          orderBy = { partNumber: 'asc' }
        }

        const resultsPromise = db.masterPart.findMany({
          where,
          select: {
            // Selective field projection for better performance
            id: true,
            partNumber: true,
            manufacturer: true,
            description: true,
            secondaryDescription: true,
            category: true,
            unitPrice: true,
            currency: true,
            supplier: true,
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        })

        return Promise.all([countPromise, resultsPromise])
      }
    )

    const response = {
      results,
      total,
      page,
      limit,
      hasMore: (page * limit) < total,
    }

    // Cache the results
    setCachedSearch(cacheKey, response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to search parts:', error)
    return NextResponse.json(
      { error: 'Failed to search parts' },
      { status: 500 }
    )
  }
}
