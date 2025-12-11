'use client'

import { useCallback, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export function FileUploader({ onFileSelect, disabled }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
        onFileSelect(file)
      }
    }
  }, [onFileSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      onFileSelect(file)
    }
  }, [onFileSelect])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
  }, [])

  return (
    <Card className="p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-4">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="flex-1 text-left">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              Drop PDF file here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports AutoCAD BOM PDF drawings
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              disabled={disabled}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button asChild disabled={disabled}>
                <span>Select PDF File</span>
              </Button>
            </label>
          </>
        )}
      </div>
    </Card>
  )
}
