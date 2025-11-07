'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBOMStore } from '@/lib/store'
import Link from 'next/link'
import { ArrowLeft, Plus, FolderOpen } from 'lucide-react'
import { openProjectManager } from '@/lib/header-actions'

export default function BOMRedirect() {
  const router = useRouter()
  const { projects, createProject } = useBOMStore()

  const containerRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (projects.length > 0) {
      const target = `/bom/${projects[0].id}`
      router.push(target)
    }
  }, [projects, router])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleResize = () => {
      // Resize handling removed for production
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleCreateProject = async () => {
    const projectNumber = `PRJ-${Date.now()}`
    const packageName = 'New Project'

    await createProject({
      projectNumber,
      packageName,
      name: 'New BOM Project',
      description: 'Created from BOM page'
    })
  }

  const handleOpenProjectManager = () => {
    openProjectManager()
  }

  const handleSelectProject = (projectId: string) => {
    router.push(`/bom/${projectId}`)
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
              <h1 className="text-3xl font-bold tracking-tight">BOM Management</h1>
              <p className="text-muted-foreground">
                Bill of Materials management system
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div ref={containerRef} className="flex items-center justify-center min-h-[300px]">
          <Card ref={cardRef} className="max-w-xs mx-auto">
            <CardHeader className="text-center">
              <CardTitle>BOM Management</CardTitle>
              <CardDescription>
                {projects.length === 0
                  ? 'Create your first project to get started with BOM management'
                  : 'Redirecting to your project...'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {projects.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    No projects found. Create your first project to start managing your bill of materials.
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
                    Found {projects.length} project(s). Redirecting you to the first one...
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
