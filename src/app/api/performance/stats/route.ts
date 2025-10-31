import { NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/performance-monitor'
import { getCacheStats } from '@/lib/search-cache'

/**
 * GET /api/performance/stats
 * 
 * Returns performance metrics for monitoring
 */
export async function GET() {
  try {
    const queryStats = performanceMonitor.getStats()
    const cacheStats = getCacheStats()

    return NextResponse.json({
      queries: queryStats,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to get performance stats:', error)
    return NextResponse.json(
      { error: 'Failed to get performance stats' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/performance/reset
 * 
 * Reset performance statistics
 */
export async function POST() {
  try {
    performanceMonitor.reset()
    
    return NextResponse.json({
      success: true,
      message: 'Performance stats reset',
    })
  } catch (error) {
    console.error('Failed to reset performance stats:', error)
    return NextResponse.json(
      { error: 'Failed to reset performance stats' },
      { status: 500 }
    )
  }
}
