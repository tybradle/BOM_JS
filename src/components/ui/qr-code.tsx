'use client'

import QRCodeLib from 'react-qr-code'
import { forwardRef } from 'react'

export interface QRCodeProps extends React.ComponentProps<'div'> {
  value: string
  size?: number
  level?: 'L' | 'M' | 'Q' | 'H'
  bgColor?: string
  fgColor?: string
  className?: string
}

export const QrCode = forwardRef<HTMLDivElement, QRCodeProps>(
  ({ value, size = 128, level = 'M', bgColor = '#ffffff', fgColor = '#000000', className, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        <QRCodeLib
          value={value}
          size={size}
          level={level}
          bgColor={bgColor}
          fgColor={fgColor}
        />
      </div>
    )
  }
)

QrCode.displayName = 'QrCode'
