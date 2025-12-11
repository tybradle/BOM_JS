/**
 * Shared Types for BOM Store
 * 
 * These types are used across multiple store slices
 */

export interface BOMItem {
    id: string
    partNumber: string
    description: string
    secondaryDescription?: string
    quantity: number
    unit: string
    unitPrice?: number
    manufacturer?: string
    supplier?: string
    category?: string
    referenceDesignator?: string
    isSpare: boolean
    status: 'ACTIVE' | 'OBSOLETE' | 'PENDING' | 'DISCONTINUED'
    order: number
    createdAt: string
    updatedAt: string
}

export interface BOMProject {
    id: string
    projectNumber: string
    packageName: string
    name?: string
    description?: string
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
    version: string
    authorId: string
    author?: {
        id: string
        name: string
        email: string
    }
    itemCount: number
    createdAt: string
    updatedAt: string
}

export interface Location {
    id: string
    name: string
    exportName?: string | null
    order: number
    projectId: string
    itemCount: number
    createdAt: string
    updatedAt: string
}

export interface BinLabel {
    id: string
    projectNumber: string
    kitString: string
    description: string
    buildQty: number
    buildingCode: string
    rackNumber: string
    category: 'Panel' | 'Field'
    qrCodeData: string
    binLocation: string
    projectId: string
    locationId: string
    createdAt: string
    updatedAt: string
}

export interface DatabaseImportResult {
    message: string
    backup: string | null
    validation: {
        tables: string[]
        integrity: string
    }
}

export interface MasterPartsImportResult {
    success: boolean
    format: string
    summary: {
        totalParsed: number
        imported: number
        updated: number
        errors: number
        duration: string
    }
}

export interface DatabaseExportProgress {
    stage: 'validating' | 'reading' | 'compressing' | 'finalizing' | 'completed' | 'error'
    progress: number
    message: string
    details?: string
}

// Re-export Glenair types from their dedicated file
export type {
    WireSystem,
    Contact,
    ContactResult,
    ArrangementOption,
    PartBuilderResult,
    ContactSizeInfo
} from '@/types/glenair'

export interface GlenairCatalog {
    id: string
    name: string
    version: string
    uploadedAt: string
    tableCount: number
}

export interface GlenairPartConfig {
    id: string
    projectId: string
    wireSystem: 'AWG' | 'MM2'
    wireValue: string
    conductorCount: number
    shellStyle: string
    arrangement: string
    contactSize: string
    phmSize: string
    partNumber: string
    contacts: any[]
    createdAt: string
    updatedAt: string
}

export interface WireGaugeSelection {
    system: 'AWG' | 'MM2'
    wireValue: string
    conductorCount: number
}
