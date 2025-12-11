import { describe, it, expect } from 'vitest'
import path from 'path'
import { parsePartsCSV, validateColumns } from '../csv-parser'

const fixturesDir = path.join(__dirname, 'fixtures')

describe('csv-parser', () => {
    describe('parsePartsCSV', () => {
        it('should parse valid CSV with standard column names', () => {
            const result = parsePartsCSV(path.join(fixturesDir, 'valid-parts.csv'))

            expect(result.totalRows).toBe(2)
            expect(result.validRows).toBe(2)
            expect(result.skippedRows).toBe(0)
            expect(result.errors).toHaveLength(0)

            expect(result.parts[0]).toEqual({
                partNumber: 'ABC-123',
                manufacturer: 'Acme Corp',
                description: 'Widget A',
                unitPrice: 10.99,
                category: 'Electronics',
                currency: undefined,
                secondaryDescription: undefined,
            })
        })

        it('should handle flexible column names (Part Numbers, Mfr, Desc)', () => {
            const result = parsePartsCSV(path.join(fixturesDir, 'alternate-columns.csv'))

            expect(result.validRows).toBe(1)
            expect(result.parts[0].partNumber).toBe('XYZ-789')
            expect(result.parts[0].manufacturer).toBe('Gamma LLC')
            expect(result.parts[0].description).toBe('Gadget C')
        })

        it('should skip rows with missing required fields', () => {
            const result = parsePartsCSV(path.join(fixturesDir, 'missing-fields.csv'))

            expect(result.totalRows).toBe(3)
            expect(result.validRows).toBe(0)
            expect(result.skippedRows).toBe(3)
            expect(result.errors).toHaveLength(3)
        })

        it('should handle empty CSV gracefully', () => {
            const result = parsePartsCSV(path.join(fixturesDir, 'empty.csv'))

            expect(result.totalRows).toBe(0)
            expect(result.validRows).toBe(0)
            expect(result.parts).toHaveLength(0)
        })
    })

    describe('validateColumns', () => {
        it('should return valid when all required columns exist', () => {
            const headers = ['Part Number', 'Manufacturer', 'Description', 'Category']

            const result = validateColumns(headers)

            expect(result.valid).toBe(true)
            expect(result.missing).toHaveLength(0)
        })

        it('should detect missing Part Number column', () => {
            const headers = ['Manufacturer', 'Description']

            const result = validateColumns(headers)

            expect(result.valid).toBe(false)
            expect(result.missing).toContain('Part Number')
        })

        it('should accept variant column names', () => {
            const headers = ['Part Numbers', 'Mfr', 'Desc']

            const result = validateColumns(headers)

            expect(result.valid).toBe(true)
        })

        it('should be case-insensitive', () => {
            const headers = ['PART NUMBER', 'manufacturer', 'DESCRIPTION']

            const result = validateColumns(headers)

            expect(result.valid).toBe(true)
        })
    })
})
