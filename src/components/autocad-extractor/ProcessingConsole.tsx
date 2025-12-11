'use client'

import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Terminal } from 'lucide-react'

interface ProcessingConsoleProps {
  logs: string[]
}

export function ProcessingConsole({ logs }: ProcessingConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  if (logs.length === 0) {
    return null
  }

  return (
    <Card className="p-4 bg-slate-950 border-slate-800">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="h-4 w-4 text-green-400" />
        <h3 className="text-sm font-semibold text-green-400">Processing Console</h3>
      </div>
      
      <ScrollArea className="h-48 w-full rounded border border-slate-800">
        <div ref={scrollRef} className="p-3 font-mono text-xs space-y-1">
          {logs.map((log, index) => (
            <div key={index} className="text-slate-300">
              <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>{' '}
              <span className="text-green-400">→</span> {log}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}
