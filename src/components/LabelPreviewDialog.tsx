'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QrCode } from '@/components/ui/qr-code'
import { Download } from 'lucide-react'
import { BinLabel } from '@/lib/store'

interface LabelPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  label: BinLabel | null
  onExport?: (label: BinLabel) => void
}

export function LabelPreviewDialog({ open, onOpenChange, label, onExport }: LabelPreviewDialogProps) {
  if (!label) return null

  const labelWidth = 4 // inches
  const labelHeight = 6 // inches
  const scale = 120 // pixels per inch for preview

  const previewWidth = labelWidth * scale
  const previewHeight = labelHeight * scale

  const handleDownload = () => {
    onExport?.(label)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Label Preview</DialogTitle>
          <DialogDescription>
            4" × 6" thermal label preview
          </DialogDescription>
        </DialogHeader>
        
        {/* Preview Container */}
        <div className="relative mx-auto bg-white" style={{ 
          width: `${previewWidth}px`, 
          height: `${previewHeight}px`,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Label Content */}
          <div className="p-4 h-full flex flex-col" style={{ 
            fontSize: `${10 * scale / 100}px`,
            fontFamily: 'Helvetica, Arial, sans-serif'
          }}>
            {/* Top Section */}
            <div className="space-y-2">
              <div className="font-bold" style={{ fontSize: `${10 * scale / 100}px` }}>
                Project: {label.projectNumber}
              </div>
              <div className="font-bold" style={{ fontSize: `${10 * scale / 100}px` }}>
                Kit: {label.kitString}
              </div>
              <div style={{ fontSize: `${9 * scale / 100}px` }}>
                Desc: {label.description}
              </div>
              <div style={{ fontSize: `${9 * scale / 100}px` }}>
                Build QTY: {label.buildQty}
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center space-y-2">
              {/* QR Code */}
              <div className="bg-white p-2 border border-gray-200" style={{ 
                width: `${2 * scale}px`, 
                height: `${2 * scale}px` 
              }}>
                <QrCode 
                  value={label.qrCodeData} 
                  size={(2 * scale) - 16} // Account for padding
                  className="w-full h-full"
                />
              </div>
              
              {/* QR Code Text */}
              <div 
                className="font-mono text-center" 
                style={{ 
                  fontSize: `${8 * scale / 100}px`,
                  color: '#374151'
                }}
              >
                {label.qrCodeData}
              </div>

              {/* Bin Location */}
              <div 
                className="font-bold text-center" 
                style={{ 
                  fontSize: `${9 * scale / 100}px`
                }}
              >
                Bin Location: {label.binLocation}
              </div>
            </div>
          </div>

          {/* Scale Indicator */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/90 px-2 py-1 rounded">
            Scale: {scale}px/in
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <div className="space-y-1">
              <div><strong>Format:</strong> 4×6 inches</div>
              <div><strong>QR Data:</strong> {label.qrCodeData}</div>
              <div><strong>Category:</strong> 
                <Badge variant="outline" className="ml-1">
                  {label.category === 'Panel' ? 'E (Electrical)' : 'F (Field)'}
                </Badge>
              </div>
            </div>
          </div>
          
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
