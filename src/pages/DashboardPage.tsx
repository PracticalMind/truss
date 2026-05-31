import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Activity, ArrowRight, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsApi } from '../services/api/projects'
import type { AppPage, PipelineStep, Project } from '../types'

interface DashboardPageProps {
  onPageChange: (page: AppPage) => void
  onStepChange: (step: PipelineStep) => void
  onOpenProject: (id: string, step: PipelineStep) => void
  showCreateModal?: boolean
  onCloseCreateModal?: () => void
}

const STATUS_STYLES: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  active:     { dot: '#f97316', text: '#f97316', bg: '#f9731618', label: 'Active' },
  completed:  { dot: '#22c55e', text: '#22c55e', bg: '#22c55e18', label: 'Completed' },
  failed:     { dot: '#ef4444', text: '#ef4444', bg: '#ef444418', label: 'Failed' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function DashboardPage({ onOpenProject, showCreateModal, onCloseCreateModal }: DashboardPageProps) {
  const qc = useQueryClient()
  const [projectName, setProjectName] = useState('')

  const showNewProject = showCreateModal ?? false
  const setShowNewProject = (v: boolean) => { if (!v) onCloseCreateModal?.() }

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => projectsApi.create({ name }),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setShowNewProject(false)
      setProjectName('')
      toast.success('Project created')
      onOpenProject(project.id, 'upload')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const handleCreate = () => {
    const name = projectName.trim() || `Project ${new Date().toLocaleDateString()}`
    createMutation.mutate(name)
  }

  const completedProjects = projects.filter((p) => p.status === 'completed')
  const avgAccuracy = '-'

  const stats = [
    { label: 'Projects', value: String(projects.length), sub: projects.length === 0 ? 'Create your first project' : 'Total projects' },
    { label: 'Models', value: String(completedProjects.length), sub: completedProjects.length === 0 ? 'Train a model to see results' : 'Completed' },
    { label: 'Avg Accuracy', value: avgAccuracy, sub: 'No models trained yet' },
  ]

  return (
    <div className="flex-1 p-6 overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-[#64748b]">Welcome back. Here's what's happening.</p>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">New Project</p>
              <button onClick={() => setShowNewProject(false)} className="text-[#64748b] hover:text-white">
                <X size={16} />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="w-full bg-[#0d1117] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4a5568] outline-none focus:border-[#f97316] mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewProject(false)}
                className="px-3 py-1.5 text-xs text-[#64748b] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="px-4 py-1.5 bg-[#f97316] hover:bg-[#ea6a0a] disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
              >
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5">
            <p className="text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest mb-3">{stat.label}</p>
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs text-[#4a5568]">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Projects List */}
      <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e2a3a] flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Recent Projects</p>
          <ArrowRight size={13} className="text-[#374151]" />
        </div>

        {isLoading && (
          <div className="px-5 py-8 text-center text-sm text-[#64748b]">Loading…</div>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-[#64748b]">No projects yet.</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="mt-2 text-xs text-[#f97316] hover:underline"
            >
              Create your first project →
            </button>
          </div>
        )}

        <div className="divide-y divide-[#1e2a3a]">
          {projects.map((project: Project) => {
            const style = STATUS_STYLES[project.status] ?? STATUS_STYLES.active
            return (
              <button
                key={project.id}
                onClick={() => onOpenProject(project.id, project.current_step ?? 'upload')}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors duration-150 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1c2333] border border-[#2d3748] flex items-center justify-center flex-shrink-0">
                  <Activity size={15} className="text-[#f97316]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{project.name}</p>
                  <p className="text-[11px] text-[#4a5568] font-mono truncate">
                    {project.filename ?? 'No file uploaded'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold uppercase"
                    style={{ color: style.text, backgroundColor: style.bg }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
                    {style.label}
                  </div>
                </div>
                <span className="text-[11px] text-[#374151] flex-shrink-0">{timeAgo(project.created_at)}</span>
                <ArrowRight size={13} className="text-[#374151] flex-shrink-0" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
