/**
 * Catalog parser utility for Glenair validated tables
 * Ported from load_validated_data() function in Part Numbering page
 */

import type { GlenairTable, ParsedCatalog, TableType } from '@/types/glenair';

/**
 * Categorize table based on headers and metadata
 */
export function categorizeTable(headers: string[], type?: string, page?: number): TableType {
  const headerStr = headers.join(' ').toLowerCase();
  const tableType = (type || '').toLowerCase();

  // Check explicit type first
  if (tableType.includes('pin/socket') || tableType.includes('contact') && tableType.includes('selection')) {
    // Separate pins and sockets based on page numbers
    if (page === 289 || page === 290) {
      return 'pin';
    } else if (page === 291 || page === 292) {
      return 'socket';
    }
    return 'pin_socket';
  }

  // Header-based detection
  if (headerStr.includes('wire') && headerStr.includes('contact')) {
    return 'wire_map';
  }
  if (headerStr.includes('arrangement') && headerStr.includes('contact')) {
    return 'arrangement';
  }
  if (headerStr.includes('shell') && headerStr.includes('phm')) {
    return 'phm';
  }
  if (headerStr.includes('part number') && headerStr.includes('contact')) {
    return 'pin_socket';
  }
  if (headerStr.includes('part number') && (headerStr.includes('wire size') || headerStr.includes('awg'))) {
    return 'pin_socket';
  }

  return 'unknown';
}

/**
 * Parse validated JSON tables into structured catalog data
 */
export function parseValidatedTables(jsonData: any): ParsedCatalog {
  const tables = jsonData.tables || jsonData;
  
  const wireMapData: any[] = [];
  const arrangementMapData: any[] = [];
  const phmMapData: any[] = [];
  const pinSocketMapData: any[] = [];
  const pinMapData: any[] = [];
  const socketMapData: any[] = [];

  Object.entries(tables).forEach(([tableKey, tableEntry]: [string, any]) => {
    const df = {
      data: tableEntry.data,
      columns: tableEntry.headers
    };

    const headers = df.columns.map((h: any) => String(h).toLowerCase());
    const headerStr = headers.join(' ');

    const tableType = categorizeTable(headers, tableEntry.type, tableEntry.page);
    const pageNum = tableEntry.page || 0;

    // Add to appropriate category
    switch (tableType) {
      case 'wire_map':
        wireMapData.push(df);
        break;
      case 'arrangement':
        arrangementMapData.push(df);
        break;
      case 'phm':
        phmMapData.push(df);
        break;
      case 'pin':
        pinMapData.push(df);
        break;
      case 'socket':
        socketMapData.push(df);
        break;
      case 'pin_socket':
        pinSocketMapData.push(df);
        break;
    }

    // Also add to pin_socket for backward compatibility
    if (tableType === 'pin' || tableType === 'socket') {
      pinSocketMapData.push(df);
    }
  });

  return {
    wireMap: wireMapData,
    arrangementMap: arrangementMapData,
    phmMap: phmMapData,
    pinSocketMap: pinSocketMapData,
    pinMap: pinMapData,
    socketMap: socketMapData
  };
}

/**
 * Extract wire map data from parsed catalog
 */
export function extractWireMap(tables: GlenairTable[]): any[] {
  const wireTables = tables.filter(t => t.type === 'wire_map');
  return wireTables.map(t => ({
    data: t.data,
    columns: t.headers
  }));
}

/**
 * Extract arrangement map data from parsed catalog
 */
export function extractArrangementMap(tables: GlenairTable[]): any[] {
  const arrangementTables = tables.filter(t => t.type === 'arrangement');
  return arrangementTables.map(t => ({
    data: t.data,
    columns: t.headers
  }));
}

/**
 * Extract PHM map data from parsed catalog
 */
export function extractPhmMap(tables: GlenairTable[]): any[] {
  const phmTables = tables.filter(t => t.type === 'phm');
  return phmTables.map(t => ({
    data: t.data,
    columns: t.headers
  }));
}

/**
 * Extract pin/socket maps from parsed catalog
 */
export function extractPinSocketMaps(tables: GlenairTable[]): {
  pinSocketMap: any[];
  pinMap: any[];
  socketMap: any[];
} {
  const pinSocketTables = tables.filter(t => t.type === 'pin' || t.type === 'socket');
  const pinTables = tables.filter(t => t.type === 'pin');
  const socketTables = tables.filter(t => t.type === 'socket');

  return {
    pinSocketMap: pinSocketTables.map(t => ({
      data: t.data,
      columns: t.headers
    })),
    pinMap: pinTables.map(t => ({
      data: t.data,
      columns: t.headers
    })),
    socketMap: socketTables.map(t => ({
      data: t.data,
      columns: t.headers
    }))
  };
}

/**
 * Convert table data to DataFrame-like structure for easier processing
 */
export function createDataFrame(data: any[][], columns: string[]) {
  return {
    data,
    columns,
    // Helper methods similar to pandas
    iterrows: function*() {
      for (let i = 0; i < data.length; i++) {
        const row: any = {};
        columns.forEach((col, idx) => {
          row[col] = data[i][idx];
        });
        yield { index: i, row };
      }
    },
    get: (column: string) => {
      const colIndex = columns.findIndex(col => col.toLowerCase() === column.toLowerCase());
      return colIndex >= 0 ? data.map(row => row[colIndex]) : [];
    },
    toObjects: () => {
      return data.map(row => {
        const obj: any = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    }
  };
}

/**
 * Find column by pattern matching
 */
export function findColumn(columns: string[], patterns: string[]): string | null {
  const lowerColumns = columns.map(c => c.toLowerCase());
  
  for (const pattern of patterns) {
    const found = lowerColumns.find(col => col.includes(pattern.toLowerCase()));
    if (found) {
      return columns[lowerColumns.indexOf(found)];
    }
  }
  
  return null;
}

/**
 * Normalize column names for consistent access
 */
export function normalizeColumns(columns: string[]): Record<string, string> {
  const normalized: Record<string, string> = {};
  
  columns.forEach(col => {
    const lower = col.toLowerCase();
    normalized[lower] = col;
    
    // Common aliases
    if (lower.includes('contact') && lower.includes('size')) {
      normalized['contact_size'] = col;
    }
    if (lower.includes('part') && lower.includes('number')) {
      normalized['part_number'] = col;
    }
    if (lower.includes('wire') && lower.includes('awg')) {
      normalized['wire_size_awg'] = col;
    }
    if (lower.includes('wire') && lower.includes('mm2')) {
      normalized['wire_size_mm2'] = col;
    }
    if (lower.includes('shell') && lower.includes('size')) {
      normalized['shell_size'] = col;
    }
    if (lower.includes('phm') && lower.includes('size')) {
      normalized['phm_size'] = col;
    }
    if (lower === 'arrangement') {
      normalized['arrangement'] = col;
    }
  });
  
  return normalized;
}