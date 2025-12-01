'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Wrench, AlertCircle, FolderOpen } from 'lucide-react'
import { useBOMStore } from '@/lib/store'
import { CatalogManager } from '@/components/glenair/CatalogManager'
import { PartNumberBuilder } from '@/components/glenair/PartNumberBuilder'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function GlenairProjectBuilder() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const {
    glenairCatalogs,
    currentCatalogId,
    currentProject,
    projects,
    fetchProjects,
    fetchProject,
    fetchGlenairCatalogs,
    setCurrentCatalogId,
    resetGlenairBuilder
  } = useBOMStore()

  const [showBuilder, setShowBuilder] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await Promise.all([
          fetchProjects(),
          fetchGlenairCatalogs(),
          fetchProject(projectId)
        ])
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadData()
    }
  }, [projectId, fetchProjects, fetchGlenairCatalogs, fetchProject])

  const handleCatalogSelect = (catalogId: string) => {
    setCurrentCatalogId(catalogId)
    resetGlenairBuilder()
  }

  const handleStartBuilder = () => {
    if (currentCatalogId) {
      setShowBuilder(true)
      resetGlenairBuilder()
    }
  }

  const handleBuilderComplete = () => {
    setShowBuilder(false)
    resetGlenairBuilder()
  }

  const handleBackToProject = () => {
    router.push(`/bom/${projectId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading project...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <CardTitle>Project Not Found</CardTitle>
                <CardDescription>
                  The requested project could not be found or may have been deleted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/bom">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Back to BOM Management
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (showBuilder && currentCatalogId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setShowBuilder(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project Builder
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Glenair Part Builder</h1>
                <p className="text-muted-foreground">
                  Building for: {currentProject.name || `${currentProject.projectNumber} - ${currentProject.packageName}`}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleBackToProject}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
          </div>

          <PartNumberBuilder
            catalogId={currentCatalogId}
            onComplete={handleBuilderComplete}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToProject}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Glenair Part Builder</h1>
              <p className="text-muted-foreground">
                Building for: {currentProject.name || `${currentProject.projectNumber} - ${currentProject.packageName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {glenairCatalogs.length} {glenairCatalogs.length === 1 ? 'Catalog' : 'Catalogs'}
            </Badge>
            <Button variant="outline" onClick={handleBackToProject}>
              <FolderOpen className="w-4 h-4 mr-2" />
              View Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <CatalogManager
              onCatalogSelect={handleCatalogSelect}
              selectedCatalogId={currentCatalogId}
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Build Parts for Project
                </CardTitle>
                <CardDescription>
                  Build Glenair connector parts that will be added directly to this project's BOM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!currentCatalogId ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please select or upload a Glenair catalog to start building parts for this project.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      onClick={handleStartBuilder} 
                      className="w-full"
                      size="lg"
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      Start Part Builder
                    </Button>
                    
                    <div className="text-sm text-muted-foreground">
                      Built parts will be automatically added to this project's BOM when you complete the wizard.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Project Number</div>
                    <div className="text-muted-foreground">{currentProject.projectNumber}</div>
                  </div>
                  <div>
                    <div className="font-medium">Package Name</div>
                    <div className="text-muted-foreground">{currentProject.packageName}</div>
                  </div>
                  <div>
                    <div className="font-medium">Status</div>
                    <div className="text-muted-foreground">{currentProject.status}</div>
                  </div>
                  <div>
                    <div className="font-medium">BOM Items</div>
                    <div className="text-muted-foreground">{currentProject.itemCount || 0}</div>
                  </div>
                </div>
                
                {currentProject.description && (
                  <div className="text-sm">
                    <div className="font-medium">Description</div>
                    <div className="text-muted-foreground">{currentProject.description}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/bom/${projectId}`}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    View Project BOM
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/glenair">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Glenair Landing Page
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}