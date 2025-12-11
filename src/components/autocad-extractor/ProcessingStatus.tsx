'use client'

import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ProcessingStatus as Status } from '@/lib/autocad-extractor/types'

interface ProcessingStatusProps {
  status: Status
}

export function ProcessingStatus({ status }: ProcessingStatusProps) {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'complete':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />
      default:
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
    }
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'complete':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  if (status.status === 'idle') {
    return null
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-4">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className={`font-semibold ${getStatusColor()}`}>
            {status.message}
          </h3>
          {status.currentPage && status.totalPages && (
            <p className="text-sm text-gray-500">
              Page {status.currentPage} of {status.totalPages}
            </p>
          )}
        </div>
      </div>
      
      {status.status !== 'complete' && status.status !== 'error' && (
        <Progress value={status.progress} className="w-full" />
      )}
    </Card>
  )
}
