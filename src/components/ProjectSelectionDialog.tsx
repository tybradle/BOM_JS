'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { 
  Plus,
  FolderOpen,
  Trash2,
  Calendar,
  FileText
} from 'lucide-react'
import { useBOMStore } from '@/lib/store'

interface ProjectSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedModule: 'bom' | 'labels' | null
}

export function ProjectSelectionDialog({ open, onOpenChange, selectedModule }: ProjectSelectionDialogProps) {
  const [projectSearch, setProjectSearch] = useState('')
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
  const router = useRouter()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    // Reset search when dialog opens/closes
    if (!open) {
      setProjectSearch('')
      setIsCreateProjectOpen(false)
    }
  }, [open])

  const handleCreateProject = async () => {
    if (!newProject.projectNumber || !newProject.packageName) return

    try {
      const createdProject = await createProject({
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

      // Navigate to the selected module with the newly created project
      if (selectedModule && createdProject?.id) {
        router.push(`/${selectedModule}/${createdProject.id}`)
        onOpenChange(false)
      }
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

  const handleSelectProject = (projectId: string) => {
    if (selectedModule) {
      router.push(`/${selectedModule}/${projectId}`)
      onOpenChange(false)
    }
  }

  const getModuleDisplayName = (module: 'bom' | 'labels') => {
    switch (module) {
      case 'bom': return 'BOM Translation Tool'
      case 'labels': return 'Bin Label Generator'
      default: return 'Unknown Module'
    }
  }

  const getModuleIcon = (module: 'bom' | 'labels') => {
    switch (module) {
      case 'bom': return '📋'
      case 'labels': return '🏷️'
      default: return '❓'
    }
  }

  const filteredProjects = projects.filter(project =>
    project.projectNumber.toLowerCase().includes(projectSearch.toLowerCase()) ||
    project.packageName.toLowerCase().includes(projectSearch.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Choose Project for {selectedModule && getModuleDisplayName(selectedModule)} {selectedModule && getModuleIcon(selectedModule)}</DialogTitle>
          <DialogDescription>
            Select a project to work with in the {selectedModule && getModuleDisplayName(selectedModule)} module.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Header with search and create */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold">Projects ({projects.length})</h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search by project number or package name"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full sm:w-80"
              />
              <Dialog open={isCreateProjectOpen} onOpenChange={(open) => {
                setIsCreateProjectOpen(open)
                // Reset form when dialog closes
                if (!open) {
                  setNewProject({ 
                    projectNumber: '', 
                    packageName: '', 
                    name: '', 
                    description: '' 
                  })
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" key={isCreateProjectOpen ? 'create-open' : 'create-closed'}>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Create a new project to use with the {selectedModule && getModuleDisplayName(selectedModule)} module.
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
                          autoFocus
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
          </div>

          {/* Projects List */}
          <div className="border rounded-lg">
            {filteredProjects.length === 0 && projectSearch ? (
              <div className="p-8 text-center text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No projects found matching "{projectSearch}".</p>
                <p className="text-sm mt-2">Try adjusting your search terms.</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No projects found. Create your first project to get started.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-0">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      {/* Project Name - Column 1 */}
                      <div className="col-span-3">
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
                      <div className="col-span-4 flex items-center justify-end gap-2 flex-wrap">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSelectProject(project.id)}
                        >
                          <FolderOpen className="w-4 h-4 mr-1" />
                          Open with {selectedModule && getModuleDisplayName(selectedModule)}
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
  )
}
