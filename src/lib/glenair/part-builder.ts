/**
 * Part builder logic for Glenair connector part number generation
 * Ported from Part Numbering page workflow
 */

import type { 
  WireSystem, 
  Contact, 
  ContactResult, 
  ArrangementOption, 
  PartBuilderConfig, 
  PartBuilderResult 
} from '@/types/glenair';
import { isWireCompatible, convertWireGauge } from './wire-gauge';
import { createDataFrame, normalizeColumns, findColumn } from './catalog-parser';

/**
 * Find compatible pin/socket part numbers for given contact size and wire gauge
 */
export function findContactPartNumbers(
  contactSize: string,
  wireValue: string,
  quantityNeeded: number,
  wireSystem: WireSystem,
  pinData: any[][],
  pinColumns: string[],
  socketData: any[][],
  socketColumns: string[]
): ContactResult {
  const result: ContactResult = { pins: [], sockets: [] };

  // Helper to search in a map
  const searchMap = (data: any[][], columns: string[], contactType: 'pin' | 'socket') => {
    if (!data || data.length === 0) return;

    const df = createDataFrame(data, columns);
    const normalizedCols = normalizeColumns(columns);
    
    for (const { row } of df.iterrows()) {
      const sizeCol = normalizedCols['contact_size'] || 'contact\nsize';
      if (String(row[sizeCol] || '').trim() !== contactSize.trim()) {
        continue;
      }

      const partNumberCol = normalizedCols['part_number'];
      const partNumber = row[partNumberCol];
      if (!partNumber || partNumber === 'N/A') continue;

      const awgRangeCol = normalizedCols['wire_size_awg'];
      const mm2RangeCol = normalizedCols['wire_size_mm2'];
      const awgRange = row[awgRangeCol] || '';
      const mm2Range = row[mm2RangeCol] || '';

      // Check compatibility with AWG range first
      if (awgRange && isWireCompatible(
        parseFloat(wireValue), 
        wireSystem, 
        String(awgRange), 
        'AWG'
      )) {
        const contact: Contact = {
          part_number: String(partNumber),
          awg_range: String(awgRange),
          mm2_range: String(mm2Range),
          quantity: quantityNeeded,
          wire_system: wireSystem,
          type: contactType
        };
        result[contactType === 'pin' ? 'pins' : 'sockets'].push(contact);
        continue;
      }

      // Check compatibility with MM2 range
      if (mm2Range && isWireCompatible(
        parseFloat(wireValue), 
        wireSystem, 
        String(mm2Range), 
        'MM2'
      )) {
        const contact: Contact = {
          part_number: String(partNumber),
          awg_range: String(awgRange),
          mm2_range: String(mm2Range),
          quantity: quantityNeeded,
          wire_system: wireSystem,
          type: contactType
        };
        result[contactType === 'pin' ? 'pins' : 'sockets'].push(contact);
      }
    }
  };

  // Search in separate maps first
  searchMap(pinData, pinColumns, 'pin');
  searchMap(socketData, socketColumns, 'socket');

  return result;
}

/**
 * Find suitable arrangements for conductor count and contact size
 */
export function findArrangements(
  conductorCount: number,
  contactSize: string,
  arrangementData: any[][],
  arrangementColumns: string[]
): ArrangementOption[] {
  if (!arrangementData || arrangementData.length === 0) {
    return [];
  }

  const df = createDataFrame(arrangementData, arrangementColumns);
  const normalizedCols = normalizeColumns(arrangementColumns);

  const possibleArrangements: ArrangementOption[] = [];

  for (const { row } of df.iterrows()) {
    // Find column for this contact size
    let sizeCol: string | null = null;
    for (const col of arrangementColumns) {
      const colStr = String(col).trim();
      if (
        colStr === contactSize ||
        colStr.endsWith(` ${contactSize}`) ||
        colStr.endsWith(`-${contactSize}`) ||
        colStr.endsWith(`- ${contactSize}`)
      ) {
        sizeCol = col;
        break;
      }
    }

    if (!sizeCol) continue;

    try {
      const val = parseInt(String(row[sizeCol] || '0').replace('-', '0'));
      if (val >= conductorCount) {
        const arrangement = String(row[normalizedCols['arrangement']] || '');
        const shellSize = arrangement.split('-')[0];

        // Calculate contact quantities for this arrangement
        const contactQuantities: Record<string, number> = {};
        for (const col of arrangementColumns) {
          const colLower = String(col).toLowerCase();
          if (colLower.startsWith('contact size') || colLower.startsWith('contact')) {
            const sizeMatch = col.match(/(\d+)$/);
            if (sizeMatch) {
              const size = sizeMatch[1];
              const count = parseInt(String(row[col] || '0').replace('-', '0'));
              if (count > 0) {
                contactQuantities[size] = count;
              }
            }
          }
        }

        possibleArrangements.push({
          count: val,
          arrangement,
          shellSize,
          contactQuantities
        });
      }
    } catch {
      // Skip invalid numeric values
      continue;
    }
  }

  // Sort by count (ascending) to find closest match
  return possibleArrangements.sort((a, b) => a.count - b.count);
}

/**
 * Calculate PHM size from shell size
 */
export function calculatePhmSize(shellSize: string, phmData: any[][], phmColumns: string[]): string {
  if (!phmData || phmData.length === 0) {
    return '18'; // Default fallback
  }

  const df = createDataFrame(phmData, phmColumns);
  const normalizedCols = normalizeColumns(phmColumns);

  for (const { row } of df.iterrows()) {
    const shellSizeCol = normalizedCols['shell_size'];
    const phmSizeCol = normalizedCols['phm_size'];
    
    if (String(row[shellSizeCol] || '').trim() === shellSize.trim()) {
      const phmSize = String(row[phmSizeCol] || '').trim();
      return phmSize || '18';
    }
  }

  return '18'; // Default fallback
}

/**
 * Build complete part number string
 */
export function buildPartNumber(config: {
  shellStyle: string;
  arrangement: string;
  phmSize: string;
}): string {
  // Extract style code from shell style
  const styleMatch = config.shellStyle.match(/\(([^)]+)\)/);
  const styleCode = styleMatch ? styleMatch[1] : '06';

  // G prefix logic for style code "06"
  const gPrefix = styleCode === '06' ? 'G' : '';

  // Build part number: FRITS[G]41{style}A{arrangement}PB0PHM{size}EMI67
  return `FRITS${gPrefix}41${styleCode}A${config.arrangement}PB0PHM${config.phmSize}EMI67`;
}

/**
 * Complete part builder workflow
 */
export function buildCompletePart(
  config: PartBuilderConfig,
  shellSize: string,
  phmData: any[][],
  phmColumns: string[]
): PartBuilderResult {
  // Step 1: Calculate PHM size
  const phmSize = calculatePhmSize(shellSize, phmData, phmColumns);

  // Step 2: Build part number
  const partNumber = buildPartNumber({
    shellStyle: config.shellStyle,
    arrangement: config.arrangement,
    phmSize
  });

  // Step 3: Build procurement summary
  const totalContacts = config.selectedContacts.reduce((sum, contact) => sum + contact.quantity, 0);
  const contactTypes = [...new Set(config.selectedContacts.map(c => c.type))];
  const typeStr = contactTypes.join(', ');

  const procurementSummary = {
    connector: partNumber,
    contacts: `${config.selectedContacts.length} part numbers (${typeStr}), ${totalContacts} total contacts`,
    type: config.shellStyle.split('(')[0].trim(),
    wire: `${config.wireValue} ${config.wireSystem}, ${config.conductorCount} conductors`
  };

  return {
    partNumber,
    phmSize,
    shellSize,
    contactQuantities: {}, // Simplified for now
    selectedContacts: config.selectedContacts,
    procurementSummary
  };
}