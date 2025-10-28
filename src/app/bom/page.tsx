'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBOMStore } from '@/lib/store'
import Link from 'next/link'
import { ArrowLeft, Plus, FolderOpen } from 'lucide-react'

export default function BOMRedirect() {
  const router = useRouter()
  const { projects, createProject } = useBOMStore()

  useEffect(() => {
    // If there are projects, redirect to the first one
    if (projects.length > 0) {
      router.push(`/bom/${projects[0].id}`)
    }
  }, [projects, router])

  const handleCreateProject = async () => {
    const projectNumber = `PRJ-${Date.now()}`
    const packageName = 'New Project'
    
    await createProject({
      projectNumber,
      packageName,
      name: 'New BOM Project',
      description: 'Created from BOM page'
    })
    
    // After creating, redirect will happen automatically
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
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>BOM Management</CardTitle>
              <CardDescription>
                {projects.length === 0 
                  ? "Create your first project to get started with BOM management"
                  : "Redirecting to your project..."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    No projects found. Create your first project to start managing your bill of materials.
                  </p>
                  <Button onClick={handleCreateProject} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Project
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
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
                    {projects.map((project) => (
                      <Button
                        key={project.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => router.push(`/bom/${project.id}`)}
                      >
                        {project.name || `${project.projectNumber} - ${project.packageName}`}
                      </Button>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
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