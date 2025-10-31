/**
 * Performance monitoring utility for tracking query execution times,
 * cache hit rates, and identifying slow operations
 */

class PerformanceMonitor {
  private queryTimes: number[] = []
  private cacheHits = 0
  private cacheMisses = 0
  private slowQueryThreshold = 200 // milliseconds

  /**
   * Measure and log query execution time
   */
  async measureQuery<T>(
    name: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    
    try {
      const result = await queryFn()
      const duration = performance.now() - start
      
      this.queryTimes.push(duration)
      
      // Log slow queries in development
      if (duration > this.slowQueryThreshold && process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Slow query: ${name} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`❌ Query failed: ${name} after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }

  /**
   * Record a cache hit
   */
  recordCacheHit() {
    this.cacheHits++
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss() {
    this.cacheMisses++
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const avgQueryTime = this.queryTimes.length > 0
      ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length
      : 0
    
    const totalCacheRequests = this.cacheHits + this.cacheMisses
    const cacheHitRate = totalCacheRequests > 0
      ? (this.cacheHits / totalCacheRequests) * 100
      : 0

    const slowQueries = this.queryTimes.filter(t => t > this.slowQueryThreshold).length

    return {
      totalQueries: this.queryTimes.length,
      avgQueryTime: parseFloat(avgQueryTime.toFixed(2)),
      slowQueries,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: parseFloat(cacheHitRate.toFixed(2)),
      minQueryTime: this.queryTimes.length > 0 ? Math.min(...this.queryTimes).toFixed(2) : 0,
      maxQueryTime: this.queryTimes.length > 0 ? Math.max(...this.queryTimes).toFixed(2) : 0,
    }
  }

  /**
   * Reset all statistics
   */
  reset() {
    this.queryTimes = []
    this.cacheHits = 0
    this.cacheMisses = 0
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()
