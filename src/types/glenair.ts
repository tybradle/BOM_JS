/**
 * Type definitions for Glenair integration module
 */

// Core types
export type WireSystem = 'AWG' | 'MM2';

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedValue?: string;
}

// Database models (matching Prisma schema)
export interface GlenairCatalog {
  id: string;
  name: string;
  version: string;
  uploadedAt: Date;
  tables: GlenairTable[];
}

export interface GlenairTable {
  id: string;
  catalogId: string;
  type: 'wire_map' | 'arrangement' | 'phm' | 'pin' | 'socket';
  page: number;
  headers: string[];
  data: any[][];
  catalog: GlenairCatalog;
}

export interface GlenairPartConfig {
  id: string;
  projectId: string;
  wireSystem: WireSystem;
  wireValue: string;
  conductorCount: number;
  shellStyle: 'Plug (06)' | 'Inline Socket (01)' | 'Panel Mount (00)';
  arrangement: string;
  contactSize: string;
  phmSize: string;
  partNumber: string;
  contacts: Contact[];
  createdAt: Date;
  project: BOMProject;
}

// Utility types for API responses
export interface Contact {
  part_number: string;
  contact_size?: string;
  awg_range?: string;
  mm2_range?: string;
  quantity: number;
  wire_system: WireSystem;
  type: 'pin' | 'socket';
}

export interface ContactSizeInfo {
  contactSize: string;
  awgRange: string;
  mm2Range: string;
  partNumbers: string[];
}

export interface ContactResult {
  pins: Contact[];
  sockets: Contact[];
}

export interface ArrangementOption {
  count: number;
  arrangement: string;
  shellSize: string;
  contactQuantities: Record<string, number>;
}

export interface PartBuilderConfig {
  catalogId: string;
  projectId?: string;
  wireSystem: WireSystem;
  wireValue: string;
  conductorCount: number;
  shellStyle: 'Plug (06)' | 'Inline Socket (01)' | 'Panel Mount (00)';
  arrangement: string;
  contactSize: string;
  selectedContacts: Contact[];
  save?: boolean;
}

export interface PartBuilderResult {
  partNumber: string;
  phmSize: string;
  shellSize: string;
  contactQuantities: Record<string, number>;
  selectedContacts: Contact[];
  procurementSummary: {
    connector: string;
    contacts: string;
    type: string;
    wire: string;
  };
}

export interface WireGaugeSelection {
  system: WireSystem;
  wireValue: string;
  conductorCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedValue?: string;
}

export interface ParsedCatalog {
  wireMap: any[][];
  arrangementMap: any[][];
  phmMap: any[][];
  pinSocketMap: any[][];
  pinMap: any[][];
  socketMap: any[][];
}

// Table type detection
export type TableType = 'wire_map' | 'arrangement' | 'phm' | 'pin' | 'socket' | 'pin_socket' | 'unknown';

// API request/response types
export interface CatalogUploadRequest {
  name: string;
  version: string;
  tables: any[];
}

export interface CatalogUploadResponse {
  catalog: GlenairCatalog;
  tableCount: number;
  message: string;
}

export interface ContactLookupRequest {
  wireValue: string;
  wireSystem: WireSystem;
  contactSize: string;
  catalogId: string;
}

export interface ArrangementLookupRequest {
  conductorCount: number;
  contactSize: string;
  catalogId: string;
}

export interface ArrangementLookupResponse {
  arrangements: ArrangementOption[];
  exactMatch: boolean;
  closestCount: number;
}

// Import existing types from main app
import type { BOMProject } from '@/lib/store';