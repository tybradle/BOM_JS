/**
 * Settings Type Definitions
 * Defines all application settings interfaces and default values
 */

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  tableRowHeight: 'compact' | 'comfortable' | 'spacious'
  fontSize: 'small' | 'medium' | 'large'
  toastPosition: 'top-right' | 'bottom-right' | 'top-center' | 'bottom-left'
}

export interface ImportSettings {
  addMissingPartsToDatabase: boolean
  defaultUnit: string
  defaultCurrency: string
}

export interface ExportSettings {
  defaultFormat: 'EPLAN' | 'CSV' | 'EXCEL'
  includeEmptyFields: boolean
  autoDownload: boolean
}

export interface ImportExportSettings {
  import: ImportSettings
  export: ExportSettings
}

export interface TableSettings {
  defaultSortColumn: string
  defaultSortDirection: 'asc' | 'desc'
  autoSaveDelay: number
  confirmBeforeDelete: boolean
  showRowNumbers: boolean
}

export interface UserSettings {
  name: string
  email: string
  defaultAuthorId: string | null
}

export interface AdvancedSettings {
  enablePerformanceMonitoring: boolean
  cacheSearchResults: boolean
  logLevel: 'error' | 'warn' | 'info' | 'debug'
  showDeveloperTools: boolean
}

export interface AppSettings {
  appearance: AppearanceSettings
  importExport: ImportExportSettings
  table: TableSettings
  user: UserSettings
  advanced: AdvancedSettings
}

/**
 * Default settings configuration
 * Used when no user settings are found
 */
export const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    theme: 'system',
    tableRowHeight: 'comfortable',
    fontSize: 'medium',
    toastPosition: 'top-right'
  },
  importExport: {
    import: {
      addMissingPartsToDatabase: true,
      defaultUnit: 'EA',
      defaultCurrency: 'USD'
    },
    export: {
      defaultFormat: 'EPLAN',
      includeEmptyFields: false,
      autoDownload: true
    }
  },
  table: {
    defaultSortColumn: 'partNumber',
    defaultSortDirection: 'asc',
    autoSaveDelay: 500,
    confirmBeforeDelete: true,
    showRowNumbers: false
  },
  user: {
    name: '',
    email: '',
    defaultAuthorId: null
  },
  advanced: {
    enablePerformanceMonitoring: false,
    cacheSearchResults: true,
    logLevel: 'warn',
    showDeveloperTools: false
  }
}

/**
 * Validates and merges partial settings with defaults
 * @param partial - Partial settings object
 * @returns Complete settings object with defaults for missing values
 */
export function mergeWithDefaults(partial: Partial<AppSettings>): AppSettings {
  return {
    appearance: {
      ...DEFAULT_SETTINGS.appearance,
      ...partial.appearance
    },
    importExport: {
      import: {
        ...DEFAULT_SETTINGS.importExport.import,
        ...partial.importExport?.import
      },
      export: {
        ...DEFAULT_SETTINGS.importExport.export,
        ...partial.importExport?.export
      }
    },
    table: {
      ...DEFAULT_SETTINGS.table,
      ...partial.table
    },
    user: {
      ...DEFAULT_SETTINGS.user,
      ...partial.user
    },
    advanced: {
      ...DEFAULT_SETTINGS.advanced,
      ...partial.advanced
    }
  }
}

/**
 * Type guard to check if a value is a valid AppSettings object
 */
export function isValidSettings(value: unknown): value is AppSettings {
  if (typeof value !== 'object' || value === null) return false
  
  const settings = value as Record<string, unknown>
  
  return (
    typeof settings.appearance === 'object' &&
    typeof settings.importExport === 'object' &&
    typeof settings.table === 'object' &&
    typeof settings.user === 'object' &&
    typeof settings.advanced === 'object'
  )
}
