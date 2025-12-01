'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBOMStore } from '@/lib/store'
import Link from 'next/link'
import { ArrowLeft, Plus, FolderOpen } from 'lucide-react'
import { openProjectManager } from '@/lib/header-actions'

export default function LabelsRedirect() {
  const router = useRouter()
  const { projects, createProject } = useBOMStore()

  const handleCreateProject = async () => {
    const projectNumber = `PRJ-${Date.now()}`
    const packageName = 'New Project'

    const createdProject = await createProject({
      projectNumber,
      packageName,
      name: 'New Label Project',
      description: 'Created from Labels page'
    })

    if (createdProject?.id) {
      router.push(`/labels/${createdProject.id}`)
    }
  }

  const handleOpenProjectManager = () => {
    openProjectManager()
  }

  const handleSelectProject = (projectId: string) => {
    router.push(`/labels/${projectId}`)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bin Label Generator</h1>
              <p className="text-muted-foreground">
                Generate QR code labels for warehouse bin management
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-[300px]">
          <Card className="max-w-xs mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Bin Label Generator</CardTitle>
              <CardDescription>
                {projects.length === 0
                  ? 'Create your first project to get started with label generation'
                  : 'Select a project to work with'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {projects.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    No projects found. Create your first project to start generating bin labels.
                  </p>
                  <Button onClick={handleCreateProject} className="w-full" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Project
                  </Button>
                  <Button variant="outline" className="w-full" size="sm" onClick={handleOpenProjectManager}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Go to Project Manager
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Found {projects.length} project(s). Select one to work with:
                  </p>
                  <div className="space-y-2">
                    {projects.map((project) => {
                      return (
                        <Button
                          key={project.id}
                          variant="outline"
                          className="w-full justify-start"
                          size="sm"
                          onClick={() => handleSelectProject(project.id)}
                        >
                          {project.name || `${project.projectNumber} - ${project.packageName}`}
                        </Button>
                      )
                    })}
                  </div>
                  <Button variant="outline" className="w-full" size="sm" onClick={handleOpenProjectManager}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Project Manager
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
