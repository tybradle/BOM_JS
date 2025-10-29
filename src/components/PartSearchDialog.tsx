'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface MasterPart {
  id: number
  partNumber: string
  manufacturer: string | null
  description: string
  secondaryDescription: string | null
  category: string | null
  unitPrice: number | null
  supplier: string | null
}

interface SearchResult {
  results: MasterPart[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

interface PartSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (part: MasterPart) => void
  initialSearch?: string
}

export function PartSearchDialog({ open, onOpenChange, onSelect, initialSearch = '' }: PartSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [results, setResults] = useState<MasterPart[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [manufacturers, setManufacturers] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  const limit = 10

  // Debounced search function
  const performSearch = useCallback(async (query: string, pageNum: number, mfr: string, cat: string) => {
    if (!query || query.length < 2) {
      setResults([])
      setTotal(0)
      setHasMore(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: query,
        page: pageNum.toString(),
        limit: limit.toString()
      })

      if (mfr !== 'all') params.append('manufacturer', mfr)
      if (cat !== 'all') params.append('category', cat)

      const response = await fetch(`/api/parts/search?${params}`)
      if (!response.ok) throw new Error('Search failed')

      const data: SearchResult = await response.json()
      setResults(data.results)
      setTotal(data.total)
      setHasMore(data.hasMore)
      setSelectedRow(null)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setTotal(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery, page, manufacturerFilter, categoryFilter)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, page, manufacturerFilter, categoryFilter, performSearch])

  // Load filter options
  useEffect(() => {
    if (open) {
      // Get unique manufacturers and categories from results
      const uniqueMfrs = new Set<string>()
      const uniqueCats = new Set<string>()
      
      results.forEach(part => {
        if (part.manufacturer) uniqueMfrs.add(part.manufacturer)
        if (part.category) uniqueCats.add(part.category)
      })

      setManufacturers(Array.from(uniqueMfrs).sort())
      setCategories(Array.from(uniqueCats).sort())
    }
  }, [open, results])

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery(initialSearch)
      setPage(1)
      setManufacturerFilter('all')
      setCategoryFilter('all')
      setSelectedRow(null)
    }
  }, [open, initialSearch])

  const handleSelect = (part: MasterPart) => {
    onSelect(part)
    onOpenChange(false)
  }

  const handleRowClick = (part: MasterPart, index: number) => {
    setSelectedRow(index)
  }

  const handleRowDoubleClick = (part: MasterPart) => {
    handleSelect(part)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedRow(prev => (prev === null ? 0 : Math.min(prev + 1, results.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedRow(prev => (prev === null ? 0 : Math.max(prev - 1, 0)))
    } else if (e.key === 'Enter' && selectedRow !== null) {
      e.preventDefault()
      handleSelect(results[selectedRow])
    }
  }

  const startIndex = (page - 1) * limit + 1
  const endIndex = Math.min(page * limit, total)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Search Parts Catalog</DialogTitle>
          <DialogDescription>
            Search for parts by part number, description, or manufacturer. Double-click or press Enter to select.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Search Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search part number, description, or manufacturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Manufacturers</SelectItem>
                  <SelectItem value="Allen-Bradley">Allen-Bradley</SelectItem>
                  <SelectItem value="SIEMENS">SIEMENS</SelectItem>
                  {manufacturers.map(mfr => (
                    <SelectItem key={mfr} value={mfr}>{mfr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          {searchQuery && !loading && (
            <div className="text-sm text-muted-foreground">
              {total > 0 ? (
                <>
                  Showing {startIndex} - {endIndex} of {total} parts
                  {(manufacturerFilter !== 'all' || categoryFilter !== 'all') && ' (filtered)'}
                </>
              ) : (
                'No parts found. Try a different search term.'
              )}
            </div>
          )}

          {/* Results Table */}
          <div className="flex-1 border rounded-md overflow-hidden flex flex-col min-h-0">
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[180px]">Part Number</TableHead>
                    <TableHead className="w-[140px]">Manufacturer</TableHead>
                    <TableHead className="min-w-[250px]">Description</TableHead>
                    <TableHead className="w-[120px]">Category</TableHead>
                    <TableHead className="w-[100px] text-right">Unit Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-muted-foreground">Searching...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        {searchQuery.length < 2
                          ? 'Enter at least 2 characters to search'
                          : 'No parts found. Try a different search term.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((part, index) => (
                      <TableRow
                        key={part.id}
                        className={`cursor-pointer ${
                          selectedRow === index ? 'bg-accent' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleRowClick(part, index)}
                        onDoubleClick={() => handleRowDoubleClick(part)}
                      >
                        <TableCell className="font-mono text-sm">{part.partNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {part.manufacturer || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="text-sm">{part.description}</div>
                            {part.secondaryDescription && (
                              <div className="text-xs text-muted-foreground">
                                {part.secondaryDescription}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {part.category && (
                            <Badge variant="secondary" className="font-normal text-xs">
                              {part.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {part.unitPrice !== null ? `$${part.unitPrice.toFixed(2)}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {results.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedRow !== null && handleSelect(results[selectedRow])}
              disabled={selectedRow === null}
            >
              Select Part
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
