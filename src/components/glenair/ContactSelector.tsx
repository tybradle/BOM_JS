'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Minus, Check } from 'lucide-react'
import type { Contact, ContactResult } from '@/types/glenair'

interface ContactSelectorProps {
  contacts: ContactResult | null
  selectedContacts: Contact[]
  onSelectionChange: (contacts: Contact[]) => void
  totalNeeded: number
  disabled?: boolean
}

export function ContactSelector({
  contacts,
  selectedContacts,
  onSelectionChange,
  totalNeeded,
  disabled = false
}: ContactSelectorProps) {
  const [activeTab, setActiveTab] = useState<'pins' | 'sockets' | 'both'>('both')

  if (!contacts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 5: Contact Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete previous steps to select contacts
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalSelected = selectedContacts.reduce((sum, c) => sum + c.quantity, 0)
  const remaining = totalNeeded - totalSelected

  const updateContactQuantity = (contact: Contact, delta: number) => {
    const existingIndex = selectedContacts.findIndex(
      c => c.part_number === contact.part_number && c.type === contact.type
    )

    if (existingIndex >= 0) {
      const newQuantity = selectedContacts[existingIndex].quantity + delta
      if (newQuantity <= 0) {
        // Remove contact
        onSelectionChange(selectedContacts.filter((_, i) => i !== existingIndex))
      } else {
        // Update quantity
        const updated = [...selectedContacts]
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQuantity }
        onSelectionChange(updated)
      }
    } else if (delta > 0) {
      // Add new contact
      onSelectionChange([...selectedContacts, { ...contact, quantity: delta }])
    }
  }

  const getContactQuantity = (contact: Contact): number => {
    const found = selectedContacts.find(
      c => c.part_number === contact.part_number && c.type === contact.type
    )
    return found?.quantity || 0
  }

  const renderContactList = (contactList: Contact[], type: 'pin' | 'socket') => {
    if (contactList.length === 0) {
      return (
        <p className="text-muted-foreground text-center py-4">
          No {type}s available for selected configuration
        </p>
      )
    }

    return (
      <div className="space-y-2">
        {contactList.map((contact) => {
          const quantity = getContactQuantity(contact)
          const isSelected = quantity > 0

          return (
            <div
              key={`${contact.part_number}-${contact.type}`}
              className={`flex items-center justify-between p-3 border rounded-lg ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{contact.part_number}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {contact.awg_range && <span>AWG: {contact.awg_range}</span>}
                  {contact.awg_range && contact.mm2_range && <span className="mx-2">|</span>}
                  {contact.mm2_range && <span>MM²: {contact.mm2_range}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => updateContactQuantity(contact, -1)}
                  disabled={disabled || quantity === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => {
                    const newQty = parseInt(e.target.value) || 0
                    const delta = newQty - quantity
                    updateContactQuantity(contact, delta)
                  }}
                  className="w-16 text-center"
                  disabled={disabled}
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => updateContactQuantity(contact, 1)}
                  disabled={disabled}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            Step 5: Contact Selection
            <Badge variant={remaining === 0 ? 'default' : 'secondary'}>
              {totalSelected} / {totalNeeded}
            </Badge>
          </span>
          {remaining > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              {remaining} more needed
            </span>
          )}
          {remaining < 0 && (
            <span className="text-sm font-normal text-amber-600">
              {Math.abs(remaining)} extra selected
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pins">
              Pins ({contacts.pins.length})
            </TabsTrigger>
            <TabsTrigger value="sockets">
              Sockets ({contacts.sockets.length})
            </TabsTrigger>
            <TabsTrigger value="both">Both</TabsTrigger>
          </TabsList>

          <TabsContent value="pins" className="mt-4">
            {renderContactList(contacts.pins, 'pin')}
          </TabsContent>

          <TabsContent value="sockets" className="mt-4">
            {renderContactList(contacts.sockets, 'socket')}
          </TabsContent>

          <TabsContent value="both" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Pins</h4>
                {renderContactList(contacts.pins, 'pin')}
              </div>
              <div>
                <h4 className="font-medium mb-2">Sockets</h4>
                {renderContactList(contacts.sockets, 'socket')}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
