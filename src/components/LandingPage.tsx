'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  ArrowRight,
  QrCode,
  Zap
} from 'lucide-react'
import { ProjectSelectionDialog } from '@/components/ProjectSelectionDialog'

const features = [
  {
    title: 'BOM Translation Tool',
    description: 'BOM Management Tool to populate BOMs based off external lists and external data. Export XML is formated to replicate Eplan Exports for synchronus updates between Eplan and this tooland real-time collaboration.',
    icon: Package,
    status: 'available',
    color: 'bg-blue-800',
    badges: ['Super Cool', 'Amazing', ]
  },
  {
    title: 'Bin Label Generator',
    description: 'Generate QR code labels for warehouse bin management with thermal printer support. 4x6 inch labels with job tracking and bin location encoding.',
    icon: QrCode,
    status: 'Beta',
    color: 'bg-green-800',
    badges: ['QR Codes', 'Warehouse', 'Thermal Print']
  },
  {
    title: 'Glenair Integration',
    description: 'Build custom Glenair connector part numbers with interactive wizard. Upload catalogs, configure specifications, and export directly to BOM projects.',
    icon: Zap,
    status: 'available',
    color: 'bg-purple-800',
    badges: ['Part Builder', 'Connector Config', 'Catalog Management']
  }
]

export default function LandingPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [selectedModule, setSelectedModule] = useState<'bom' | 'labels' | null>(null)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="pt-16 pb-2 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              ATS IA 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-450 to-blue-800">
                {" "}CHD
              </span>
              <br />
              BOM Management Suite
            </h2>
          </div>
        </div>
      </section>

      {/* Features Section */}
  <section className="pt-6 pb-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Available Tools
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card 
                key={feature.title}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  feature.status === 'available' 
                    ? 'cursor-pointer hover:border-blue-500' 
                    : 'opacity-75 cursor-not-allowed'
                }`}
                onMouseEnter={() => setHoveredCard(feature.title)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`h-12 w-12 ${feature.color} rounded-lg flex items-center justify-center`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    {feature.status === 'available' ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Available
                      </Badge>
                    ) : feature.status === 'coming-soon' ? (
                      <Badge variant="secondary">Coming Soon</Badge>
                    ) : (
                      <Badge variant="outline">Planned</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {feature.badges.map((badge, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  {feature.status === 'available' ? (
                    <Button
                      className="w-full"
                      onClick={() => {
                        // Glenair goes directly to tool (no project required)
                        if (feature.title === 'Glenair Integration') {
                          router.push('/glenair')
                          return
                        }
                        
                        let selectedModuleType: 'bom' | 'labels'
                        if (feature.title === 'Bin Label Generator') {
                          selectedModuleType = 'labels'
                        } else {
                          selectedModuleType = 'bom'
                        }
                        setSelectedModule(selectedModuleType)
                        setIsProjectDialogOpen(true)
                      }}
                    >
                      Launch Tool
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      {feature.status === 'coming-soon' ? 'Coming Soon' : 'Planned'}
                    </Button>
                  )}
                </CardContent>

                {/* Hover effect overlay */}
                {feature.status === 'available' && hoveredCard === feature.title && (
                  <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Project Selection Dialog */}
      <ProjectSelectionDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        selectedModule={selectedModule}
      />
    </div>
  )
}