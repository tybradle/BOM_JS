'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// Shell style options with their codes
export const SHELL_STYLES = [
  { value: 'Plug (06)', label: 'Plug', code: '06' },
  { value: 'Inline Socket (01)', label: 'Inline Socket', code: '01' },
  { value: 'Panel Mount (00)', label: 'Panel Mount Receptacle', code: '00' },
] as const

interface ShellStyleSelectorProps {
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
}

export function ShellStyleSelector({
  value,
  onChange,
  disabled = false
}: ShellStyleSelectorProps) {
  const selectedStyle = SHELL_STYLES.find(s => s.value === value)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Step 4: Shell Style
          {selectedStyle && (
            <Badge variant="secondary">{selectedStyle.label}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Connector Type</Label>
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select shell style" />
            </SelectTrigger>
            <SelectContent>
              {SHELL_STYLES.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{style.label}</span>
                    <span className="text-muted-foreground text-sm">
                      (Code: {style.code})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedStyle && (
          <div className="text-sm text-muted-foreground">
            <p>
              {selectedStyle.code === '06' && 'Cable-mounted plug connector'}
              {selectedStyle.code === '01' && 'Cable-mounted inline socket connector'}
              {selectedStyle.code === '00' && 'Panel-mounted receptacle connector'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
