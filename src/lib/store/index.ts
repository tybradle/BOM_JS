/**
 * Store Index - Re-exports all stores and types
 * 
 * This maintains backward compatibility with existing imports
 * while providing a modular architecture
 */

// Re-export the main combined store
export { useBOMStore } from './store'

// Re-export all types for consumers
export type {
    BOMItem,
    BOMProject,
    Location,
    BinLabel,
    DatabaseImportResult,
    MasterPartsImportResult,
    DatabaseExportProgress,
    GlenairCatalog,
    GlenairPartConfig,
    WireGaugeSelection,
} from './types'
