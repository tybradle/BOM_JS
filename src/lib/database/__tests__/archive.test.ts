import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdmZip from 'adm-zip'

// Mock fs/promises
vi.mock('fs/promises', () => ({
    default: {
        stat: vi.fn(),
        access: vi.fn(),
        readdir: vi.fn(),
        writeFile: vi.fn(),
        unlink: vi.fn(),
        mkdir: vi.fn(),
    },
    stat: vi.fn(),
    access: vi.fn(),
    readdir: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
    mkdir: vi.fn(),
}))

import fs from 'fs/promises'
import {
    validateArchiveBuffer,
    getDatabaseArchiveExtension,
} from '../archive'

describe('database/archive', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getDatabaseArchiveExtension', () => {
        it('should return .zip extension', () => {
            expect(getDatabaseArchiveExtension()).toBe('.zip')
        })
    })

    describe('validateArchiveBuffer', () => {
        it('should throw error for empty buffer', async () => {
            await expect(validateArchiveBuffer(Buffer.from([]))).rejects.toThrow('Archive buffer is empty')
        })

        it('should throw error for null buffer', async () => {
            await expect(validateArchiveBuffer(null as any)).rejects.toThrow('Archive buffer is empty')
        })

        it('should accept valid zip buffer', async () => {
            const zip = new AdmZip()
            zip.addFile('test.db', Buffer.from('test data'))
            const buffer = zip.toBuffer()

            await expect(validateArchiveBuffer(buffer)).resolves.not.toThrow()
        })

        it('should throw error for invalid zip data', async () => {
            const invalidBuffer = Buffer.from('this is not a zip file')

            await expect(validateArchiveBuffer(invalidBuffer)).rejects.toThrow('Invalid archive format')
        })

        it('should throw error for empty archive', async () => {
            const zip = new AdmZip()
            const buffer = zip.toBuffer()

            await expect(validateArchiveBuffer(buffer)).rejects.toThrow('Archive contains no entries')
        })
    })

    describe('archive creation and extraction flow', () => {
        it('should create valid zip with database file', () => {
            const zip = new AdmZip()
            const testData = Buffer.from('SQLite format 3\0')
            zip.addFile('custom.db', testData)

            const buffer = zip.toBuffer()
            const newZip = new AdmZip(buffer)
            const entries = newZip.getEntries()

            expect(entries).toHaveLength(1)
            expect(entries[0].entryName).toBe('custom.db')
            expect(entries[0].getData().toString()).toBe('SQLite format 3\0')
        })

        it('should preserve file content through zip/unzip cycle', () => {
            const originalContent = 'Database content with special chars: üöä'
            const zip = new AdmZip()
            zip.addFile('test.db', Buffer.from(originalContent))

            const buffer = zip.toBuffer()
            const extractedZip = new AdmZip(buffer)
            const extractedContent = extractedZip.getEntries()[0].getData().toString()

            expect(extractedContent).toBe(originalContent)
        })
    })
})
