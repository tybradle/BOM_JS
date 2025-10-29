'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { 
  Package, 
  ArrowRight,
  Sparkles,
  Plus,
  FolderOpen,
  Trash2,
  Edit,
  Calendar,
  FileText
} from 'lucide-react'
import { useBOMStore } from '@/lib/store'

const features = [
  {
    title: 'BOM Management',
    description: 'Comprehensive Bill of Materials management system with Excel-like editing, import/export capabilities, and real-time collaboration.',
    icon: Package,
    status: 'available',
    color: 'bg-blue-500',
    badges: ['Excel-like', 'Import/Export', 'Real-time']
  }
]

export default function LandingPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false)
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [newProject, setNewProject] = useState({ 
    projectNumber: '', 
    packageName: '', 
    name: '', 
    description: '' 
  })
  
  const { 
    projects, 
    fetchProjects, 
    createProject, 
    deleteProject,
    loading 
  } = useBOMStore()
  
  const { toast } = useToast()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreateProject = async () => {
    if (!newProject.projectNumber || !newProject.packageName) return

    try {
      await createProject({
        projectNumber: newProject.projectNumber,
        packageName: newProject.packageName,
        name: newProject.name,
        description: newProject.description
      })

      setNewProject({ 
        projectNumber: '', 
        packageName: '', 
        name: '', 
        description: '' 
      })
      setIsCreateProjectOpen(false)
      
      toast({
        title: "Project created",
        description: "Your project has been created successfully."
      })
    } catch (error) {
      toast({
        title: "Failed to create project",
        description: "There was an error creating your project. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete project "${projectName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteProject(projectId)
      toast({
        title: "Project deleted",
        description: `Project "${projectName}" has been deleted.`
      })
    } catch (error) {
      toast({
        title: "Failed to delete project",
        description: "There was an error deleting the project. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Manufacturing Suite</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Dialog open={isProjectManagerOpen} onOpenChange={setIsProjectManagerOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Project Manager
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Button variant="ghost" size="sm">Settings</Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Manufacturing
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Management
              </span>
              <br />
              Tools
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              Professional tools for BOM management and manufacturing operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Dialog open={isProjectManagerOpen} onOpenChange={setIsProjectManagerOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Manage Projects
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[85vh]">
                  <DialogHeader>
                    <DialogTitle>Project Manager</DialogTitle>
                    <DialogDescription>
                      Create, open, and manage your BOM projects.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Create Project Button */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Projects ({projects.length})</h3>
                      <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                            <DialogDescription>
                              Create a new BOM project to manage your bill of materials.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="project-number">Project Number *</Label>
                                <Input
                                  id="project-number"
                                  value={newProject.projectNumber}
                                  onChange={(e) => setNewProject({ ...newProject, projectNumber: e.target.value })}
                                  placeholder="e.g., PRJ-001"
                                />
                              </div>
                              <div>
                                <Label htmlFor="package-name">Package Name *</Label>
                                <Input
                                  id="package-name"
                                  value={newProject.packageName}
                                  onChange={(e) => setNewProject({ ...newProject, packageName: e.target.value })}
                                  placeholder="e.g., Main Control Board"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="project-name">Display Name (optional)</Label>
                              <Input
                                id="project-name"
                                value={newProject.name}
                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                placeholder="Leave blank to use auto-generated name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="project-description">Description (optional)</Label>
                              <Textarea
                                id="project-description"
                                value={newProject.description}
                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                placeholder="Enter project description"
                              />
                            </div>
                            <Button onClick={handleCreateProject} className="w-full" disabled={loading || !newProject.projectNumber || !newProject.packageName}>
                              {loading ? 'Creating...' : 'Create Project'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Projects List */}
                    <div className="border rounded-lg">
                      {projects.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No projects found. Create your first project to get started.</p>
                        </div>
                      ) : (
                        <div className="max-h-96 overflow-y-auto">
                          <div className="grid grid-cols-1 gap-0">
                            {projects.map((project) => (
                              <div
                                key={project.id}
                                className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                              >
                                {/* Project Name - Column 1 */}
                                <div className="col-span-4">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">
                                      {project.name || `${project.projectNumber} - ${project.packageName}`}
                                    </h4>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {project.projectNumber}
                                  </div>
                                </div>

                                {/* Description - Column 2 */}
                                <div className="col-span-5">
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {project.description || `${project.packageName} - ${project.projectNumber}`}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <FileText className="w-3 h-3" />
                                      {project.itemCount || 0} items
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(project.updatedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions - Column 3 */}
                                <div className="col-span-3 flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <Link href={`/bom/${project.id}`}>
                                      <FolderOpen className="w-4 h-4 mr-1" />
                                      Open
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteProject(project.id, project.name || `${project.projectNumber} - ${project.packageName}`)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Available Tools
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Professional manufacturing management tools
            </p>
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
                    <Button className="w-full" onClick={() => setIsProjectManagerOpen(true)}>
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

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">Manufacturing Suite</span>
            </div>
            <div className="text-center text-slate-400 text-sm">
              <p>Professional manufacturing management tools</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}