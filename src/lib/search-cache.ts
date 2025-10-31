import { LRUCache } from 'lru-cache'

interface CacheOptions {
  max: number      // Max items in cache
  ttl: number      // Time to live (milliseconds)
  maxSize: number  // Max memory size in bytes
}

// Configure LRU cache for search results
const searchCache = new LRUCache<string, any>({
  max: 500,                   // Store up to 500 different search results
  ttl: 1000 * 60 * 5,        // 5 minute TTL
  maxSize: 50 * 1024 * 1024, // 50MB max memory
  sizeCalculation: (value) => JSON.stringify(value).length,
  updateAgeOnGet: true,       // Reset TTL on cache hit
})

/**
 * Get cached search results
 */
export function getCachedSearch(key: string) {
  return searchCache.get(key)
}

/**
 * Set search results in cache
 */
export function setCachedSearch(key: string, value: any) {
  searchCache.set(key, value)
}

/**
 * Clear entire search cache (use after data imports)
 */
export function clearSearchCache() {
  searchCache.clear()
}

/**
 * Generate cache key from search parameters
 */
export function generateCacheKey(params: {
  query: string
  page: number
  limit: number
  manufacturer?: string
  category?: string
}): string {
  // Normalize query (lowercase, trim) for consistent cache keys
  const normalizedQuery = params.query.toLowerCase().trim()
  
  return `search:${normalizedQuery}:${params.page}:${params.limit}:${params.manufacturer || ''}:${params.category || ''}`
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: searchCache.size,
    maxSize: searchCache.max,
    calculatedSize: searchCache.calculatedSize,
  }
}
