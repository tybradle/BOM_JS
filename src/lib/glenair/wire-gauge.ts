/**
 * Wire gauge utilities ported from Python utils.wire_gauge
 * Handles AWG and MM2 wire gauge conversions and compatibility checks
 */

import type { WireSystem, ValidationResult } from '@/types/glenair';

// AWG to MM2 conversion table (cross-sectional area in mm²)
export const AWG_TO_MM2: Record<number, number> = {
  4: 21.15,
  6: 13.30,
  8: 8.37,
  10: 5.26,
  12: 3.31,
  14: 2.08,
  16: 1.31,
  18: 0.82,
  20: 0.52,
  22: 0.33,
  24: 0.20,
  26: 0.13,
  28: 0.08,
  30: 0.05,
  32: 0.03,
  34: 0.02,   // Added: 34 AWG = 0.02 mm²
  36: 0.013,  // Added: 36 AWG = 0.013 mm²
  40: 0.005   // Added: 40 AWG = 0.005 mm²
};

// Create reverse lookup for MM2 to AWG
export const MM2_TO_AWG: Record<number, number> = {};
Object.entries(AWG_TO_MM2).forEach(([awg, mm2]) => {
  MM2_TO_AWG[mm2] = parseInt(awg);
});

/**
 * Standard wire sizes for dropdown selection
 * AWG: ordered from smallest wire (highest number) to largest wire (lowest number)
 * MM2: ordered from smallest to largest cross-sectional area
 * 
 * Based on common industry standard wire sizes that correspond to the AWG_TO_MM2 conversion table
 */
export const STANDARD_WIRE_SIZES = {
  awg: ['40', '36', '34', '32', '30', '28', '26', '24', '22', '20', '18', '16', '14', '12', '10', '8', '6', '4'],
  mm2: ['0.005', '0.013', '0.02', '0.03', '0.05', '0.08', '0.13', '0.20', '0.33', '0.52', '0.82', '1.31', '2.08', '3.31', '5.26', '8.37', '13.30', '21.15']
};

/**
 * Normalize decimal separators from European format (comma) to US format (period).
 * Handles ranges like "0,15-0,6" -> "0.15-0.6" and "0,15÷0,6" -> "0.15÷0.6"
 */
export function normalizeDecimal(value: string): string {
  if (!value) return value;

  // Split by range separators while preserving them
  const parts = value.split(/(-|÷)/);
  const normalizedParts: string[] = [];

  for (const part of parts) {
    // Keep separators as-is
    if (part === '-' || part === '÷') {
      normalizedParts.push(part);
    } else {
      // Replace comma with period for each part
      normalizedParts.push(part.replace(/,/g, '.'));
    }
  }

  return normalizedParts.join('');
}

/**
 * Parse wire range string into min/max values
 * Supports formats: "12-16", "18÷16", "0.5-2.5", "0,15-0,6"
 */
export function parseWireRange(rangeStr: string, system: WireSystem): [number | null, number | null] {
  if (!rangeStr || typeof rangeStr !== 'string') {
    return [null, null];
  }

  let cleanRange = rangeStr.trim();
  
  // Handle N/A cases
  if (cleanRange === '' || cleanRange === '/' || cleanRange.toLowerCase() === 'n/a' || 
      cleanRange.toLowerCase() === 'na' || cleanRange.toLowerCase() === 'not applicable') {
    return [null, null];
  }

  // Normalize decimal separators (European comma to period)
  cleanRange = normalizeDecimal(cleanRange);

  // Handle single value (no range)
  if (!cleanRange.includes('-') && !cleanRange.includes('÷')) {
    try {
      const value = parseFloat(cleanRange);
      if (isNaN(value)) return [null, null];
      return [value, value];
    } catch {
      return [null, null];
    }
  }

  // Handle range with ÷ or -
  const separator = cleanRange.includes('÷') ? '÷' : '-';
  try {
    const parts = cleanRange.split(separator);
    if (parts.length === 2) {
      const start = parseFloat(parts[0].trim());
      const end = parseFloat(parts[1].trim());

      if (isNaN(start) || isNaN(end)) {
        return [null, null];
      }

      if (system === 'AWG') {
        // AWG is inverse - lower number = larger wire
        // Return [larger_wire, smaller_wire] = [max_value, min_value]
        return [Math.max(start, end), Math.min(start, end)];
      } else {
        // MM2 is normal - lower number = smaller wire
        return [Math.min(start, end), Math.max(start, end)];
      }
    }
  } catch {
    // Fall through to return null
  }

  return [null, null];
}

/**
 * Convert AWG fraction to numeric value
 * 1/0 = -1, 2/0 = -2, 3/0 = -3, 4/0 = -4
 */
export function parseAwgValue(value: string | number): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const v = String(value).trim();
  // Handle fraction format like "1/0"
  if (v.includes('/')) {
    const [numStr, denomStr] = v.split('/');
    const num = parseInt(numStr, 10);
    const denom = parseInt(denomStr, 10);
    if (!isNaN(num) && denom === 0) {
      return -Math.abs(num); // represent 1/0 as -1
    }
    // If it's something else, fall through
  }
  if (v === '0') return 0;
  const num = parseFloat(v);
  if (isNaN(num)) return null;
  return num;
}

/**
 * Convert AWG value to MM2
 */
export function awgToMm2(awgValue: number): number | null {
  // Direct lookup for integer AWG values
  if (awgValue >= 0 && awgValue <= 40 && Number.isInteger(awgValue)) {
    return AWG_TO_MM2[awgValue] || null;
  }
  // For fractional AWG (e.g., -1 for 1/0), find nearest standard size
  const absValue = Math.abs(awgValue);
  return AWG_TO_MM2[absValue] || null;
}

/**
 * Convert MM2 value to AWG
 */
export function mm2ToAwg(mm2Value: number): number | null {
  // Find closest AWG value
  let closestAwg: number | null = null;
  let minDiff = Infinity;

  Object.entries(AWG_TO_MM2).forEach(([awg, mm2]) => {
    const diff = Math.abs(mm2 - mm2Value);
    if (diff < minDiff) {
      minDiff = diff;
      closestAwg = parseInt(awg);
    }
  });

  return closestAwg;
}

/**
 * Convert wire gauge between systems
 */
export function convertWireGauge(
  value: number, 
  from: WireSystem, 
  to: WireSystem
): number | null {
  if (from === to) return value;

  if (from === 'AWG' && to === 'MM2') {
    return awgToMm2(value);
  }

  if (from === 'MM2' && to === 'AWG') {
    return mm2ToAwg(value);
  }

  return null;
}

/**
 * Check if wire value is compatible with a range
 */
export function isWireCompatible(
  inputValue: number,
  inputSystem: WireSystem,
  rangeStr: string,
  rangeSystem: WireSystem,
  tolerance: number = 0.1
): boolean {
  const [rangeMin, rangeMax] = parseWireRange(rangeStr, rangeSystem);
  
  if (rangeMin === null || rangeMax === null) {
    return false;
  }

  // Convert input value to range system if needed
  let comparableValue: number | null = inputValue;
  if (inputSystem !== rangeSystem) {
    comparableValue = convertWireGauge(inputValue, inputSystem, rangeSystem);
    if (comparableValue === null) {
      return false;
    }
  }

  // For AWG, smaller numbers are larger wires (reverse order)
  if (rangeSystem === 'AWG') {
    // rangeMin is the larger wire (smaller number), rangeMax is the smaller wire (larger number)
    return comparableValue >= rangeMin && comparableValue <= rangeMax;
  }

  // For MM2, normal numeric comparison with tolerance
  return comparableValue >= (rangeMin - tolerance) && comparableValue <= (rangeMax + tolerance);
}

/**
 * Format wire value for display
 */
export function formatWireValue(value: number, system: WireSystem): string {
  if (system === 'AWG') {
    // Convert back negative values for AWG fractions
    if (value === -1) return '1/0';
    if (value === -2) return '2/0';
    if (value === -3) return '3/0';
    if (value === -4) return '4/0';
    return value.toString();
  }
  
  // MM2 - format with appropriate precision
  if (value < 1) {
    return value.toFixed(2);
  }
  return value.toFixed(1);
}

/**
 * Get equivalent value in other system
 */
export function getEquivalentValue(value: string, system: WireSystem): string | null {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;

  let converted: number | null = null;
  
  if (system === 'AWG') {
    converted = awgToMm2(numValue);
  } else {
    converted = mm2ToAwg(numValue);
  }

  if (converted === null) return null;

  const targetSystem = system === 'AWG' ? 'MM2' : 'AWG';
  return formatWireValue(converted, targetSystem);
}

/**
 * Extract unique wire sizes from table data
 * Handles both row-object format and DataFrame-like structures
 */
export function extractWireSizesFromData(
  data: any[] | { data: any[][], columns: string[] }
): { awg: string[], mm2: string[] } {
  const awgSizes = new Set<string>();
  const mm2Sizes = new Set<string>();

  // Normalize input - handle DataFrame-like structure
  let rows: any[];
  if (Array.isArray(data)) {
    rows = data;
  } else if (data && Array.isArray(data.data) && Array.isArray(data.columns)) {
    // Convert DataFrame-like to array of objects
    rows = data.data.map(row => {
      const obj: Record<string, any> = {};
      data.columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  } else {
    return { awg: [], mm2: [] };
  }

  // Find wire size columns
  const findColumns = (row: any): { awgCol: string | null, mm2Col: string | null } => {
    let awgCol: string | null = null;
    let mm2Col: string | null = null;
    
    for (const key of Object.keys(row)) {
      const lowerKey = key.toLowerCase();
      if ((lowerKey.includes('awg') && lowerKey.includes('wire')) || 
          (lowerKey.includes('wire') && lowerKey.includes('size') && !lowerKey.includes('mm'))) {
        awgCol = key;
      }
      if ((lowerKey.includes('mm2') || lowerKey.includes('mm²')) && lowerKey.includes('wire')) {
        mm2Col = key;
      }
    }
    return { awgCol, mm2Col };
  };

  // Process rows
  rows.forEach(row => {
    if (!row || typeof row !== 'object') return;
    
    const { awgCol, mm2Col } = findColumns(row);

    // Process AWG column
    if (awgCol && row[awgCol]) {
      const value = String(row[awgCol]).trim();
      if (value && value !== '/' && value.toLowerCase() !== 'n/a' && value.toLowerCase() !== 'na') {
        // Parse ranges like "26-20" or "26÷20" into individual values
        if (value.includes('-') || value.includes('÷')) {
          const separator = value.includes('÷') ? '÷' : '-';
          const parts = value.split(separator);
          parts.forEach(part => {
            const cleaned = part.trim();
            if (cleaned) awgSizes.add(cleaned);
          });
        } else {
          awgSizes.add(value);
        }
      }
    }

    // Process MM2 column
    if (mm2Col && row[mm2Col]) {
      let value = String(row[mm2Col]).trim();
      if (value && value !== '/' && value.toLowerCase() !== 'n/a' && value.toLowerCase() !== 'na') {
        // Normalize decimal separators
        value = normalizeDecimal(value);

        // Parse ranges like "0.15-0.6" into individual values
        if (value.includes('-') || value.includes('÷')) {
          const separator = value.includes('÷') ? '÷' : '-';
          const parts = value.split(separator);
          parts.forEach(part => {
            const cleaned = part.trim();
            if (cleaned) {
              try {
                const val = parseFloat(cleaned);
                // Normalize: remove trailing .0 for whole numbers
                mm2Sizes.add(Number.isInteger(val) ? String(Math.round(val)) : String(val));
              } catch {
                mm2Sizes.add(cleaned);
              }
            }
          });
        } else {
          try {
            const val = parseFloat(value);
            mm2Sizes.add(Number.isInteger(val) ? String(Math.round(val)) : String(val));
          } catch {
            mm2Sizes.add(value);
          }
        }
      }
    }
  });

  // Sort functions - order from smallest wire to largest wire
  // AWG: 30 → 28 → ... → 4 → 2 → 1 → 1/0 → 2/0 → 3/0 → 4/0
  // MM2: 0.05 → 0.08 → ... → 400 → 500
  const sortAwg = (a: string, b: string): number => {
    const key = (val: string): number => {
      // Ought sizes (larger wires) - use negative values so they sort last
      if (val === '4/0') return -4;
      if (val === '3/0') return -3;
      if (val === '2/0') return -2;
      if (val === '1/0') return -1;
      if (val === '0') return 0;
      try {
        // Regular AWG: higher numbers = smaller wires, should come first
        return parseFloat(val);
      } catch {
        return 999;
      }
    };
    // Sort descending by key value (30 before 28 before ... before 1/0 before 4/0)
    return key(b) - key(a);
  };

  const sortMm2 = (a: string, b: string): number => {
    try {
      // Sort ascending - smaller values first
      return parseFloat(a) - parseFloat(b);
    } catch {
      return 0;
    }
  };

  return {
    awg: Array.from(awgSizes).sort(sortAwg),
    mm2: Array.from(mm2Sizes).sort(sortMm2)
  };
}

/**
 * Contact size with wire range information
 */
export interface ContactSizeInfo {
  contactSize: string;
  awgRange: string;
  mm2Range: string;
  partNumbers: string[];
}

/**
 * Get compatible contact sizes for a given wire gauge from pin/socket data
 * 
 * @param wireValue - The wire gauge value (e.g., "22" for AWG or "0.5" for MM2)
 * @param wireSystem - The wire system (AWG or MM2)
 * @param pinSocketData - Array of rows from pin/socket tables
 * @returns Array of contact sizes that are compatible with the wire gauge
 */
export function getCompatibleContactSizes(
  wireValue: string,
  wireSystem: WireSystem,
  pinSocketData: Array<Record<string, unknown>>
): ContactSizeInfo[] {
  // Validate inputs
  if (!wireValue || typeof wireValue !== 'string') {
    return [];
  }
  
  if (!pinSocketData || !Array.isArray(pinSocketData) || pinSocketData.length === 0) {
    return [];
  }

  const numericWireValue = parseFloat(wireValue);
  if (isNaN(numericWireValue)) {
    return [];
  }

  // Group contacts by contact size
  const contactSizeMap = new Map<string, ContactSizeInfo>();

  for (const row of pinSocketData) {
    // Validate row is an object
    if (!row || typeof row !== 'object') {
      continue;
    }
    
    // Find contact size column (may be "Contact\nSize" or "contact_size")
    const contactSize = row['Contact\nSize'] || row['contact_size'] || row['ContactSize'];
    if (contactSize === undefined || contactSize === null) continue;

    const contactSizeStr = String(contactSize).trim();
    if (!contactSizeStr || contactSizeStr === '/' || contactSizeStr.toLowerCase() === 'n/a') {
      continue;
    }

    // Find wire range columns - safely convert to string
    const awgRangeRaw = row['Wire Size - AWG'] || row['wire_size_awg'] || row['WireSizeAWG'];
    const mm2RangeRaw = row['Wire Size - mm2'] || row['Wire Size - MM2'] || row['wire_size_mm2'] || row['WireSizeMM2'];
    const partNumberRaw = row['Part number'] || row['part_number'] || row['PartNumber'];
    
    const awgRange = awgRangeRaw !== undefined && awgRangeRaw !== null ? String(awgRangeRaw) : '';
    const mm2Range = mm2RangeRaw !== undefined && mm2RangeRaw !== null ? String(mm2RangeRaw) : '';
    const partNumber = partNumberRaw !== undefined && partNumberRaw !== null ? String(partNumberRaw) : '';

    // Check if wire value is compatible with this contact
    let isCompatible = false;

    // Try AWG range first
    if (awgRange && awgRange.trim() !== '' && awgRange.trim() !== '/') {
      isCompatible = isWireCompatible(numericWireValue, wireSystem, awgRange, 'AWG');
    }

    // If not compatible with AWG, try MM2
    if (!isCompatible && mm2Range && mm2Range.trim() !== '' && mm2Range.trim() !== '/') {
      isCompatible = isWireCompatible(numericWireValue, wireSystem, mm2Range, 'MM2');
    }

    if (isCompatible) {
      const existing = contactSizeMap.get(contactSizeStr);
      if (existing) {
        // Add part number if not already present
        if (partNumber && !existing.partNumbers.includes(partNumber)) {
          existing.partNumbers.push(partNumber);
        }
      } else {
        contactSizeMap.set(contactSizeStr, {
          contactSize: contactSizeStr,
          awgRange: awgRange,
          mm2Range: mm2Range,
          partNumbers: partNumber ? [partNumber] : []
        });
      }
    }
  }

  // Convert to array and sort by contact size
  const result = Array.from(contactSizeMap.values());
  
  // Sort contact sizes: numeric first (ascending), then alphanumeric
  result.sort((a, b) => {
    const aNum = parseFloat(a.contactSize);
    const bNum = parseFloat(b.contactSize);
    
    // Both numeric
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    
    // One is numeric, one isn't
    if (!isNaN(aNum)) return -1;
    if (!isNaN(bNum)) return 1;
    
    // Both non-numeric, sort alphabetically
    return a.contactSize.localeCompare(b.contactSize);
  });

  return result;
}

/**
 * Validate wire gauge input
 * Matches Python validation logic exactly
 */
export function validateWireInput(value: string, system: WireSystem): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, error: 'Value cannot be empty' };
  }

  const cleanValue = value.trim();

  if (system === 'AWG') {
    // Parse AWG value first
    const parsed = parseAwgValue(cleanValue);
    if (parsed === null) {
      return { isValid: false, error: 'Invalid AWG format. Use format like "12" or "1/0"' };
    }

    // Check range
    if (parsed < 0 || parsed > 40) {
      return { isValid: false, error: 'AWG value must be between 0 and 40' };
    }

    // Check if it's a standard size
    const absValue = Math.abs(parsed);
    if (!AWG_TO_MM2[absValue]) {
      return { isValid: false, error: `AWG ${parsed} is not a standard size` };
    }

    return { isValid: true, normalizedValue: cleanValue };
  } else {
    // MM2 - normalize decimal first
    const normalized = normalizeDecimal(cleanValue);
    
    try {
      const mm2Value = parseFloat(normalized);
      if (isNaN(mm2Value)) {
        return { isValid: false, error: 'Invalid MM2 value format' };
      }

      if (mm2Value <= 0) {
        return { isValid: false, error: 'MM2 value must be positive' };
      }

      if (mm2Value > 100) {
        return { isValid: false, error: 'MM2 value seems too large' };
      }

      return { isValid: true, normalizedValue: normalized };
    } catch {
      return { isValid: false, error: 'Invalid MM2 value format' };
    }
  }
}