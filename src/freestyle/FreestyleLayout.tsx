import { useState } from 'react'
import FreestyleTopBar from './FreestyleTopBar'
import FreestyleDataTable from './FreestyleDataTable'
import FreestyleDrawer from './FreestyleDrawer'
import FreestyleBottomBar from './FreestyleBottomBar'
import FreestyleUploadModal from './FreestyleUploadModal'
import type { AppPage, PipelineStep } from '../types'

interface FreestyleLayoutProps {
  projectId: string
  currentStep: PipelineStep
  onStepChange: (step: PipelineStep) => void
  onPageChange: (page: AppPage) => void
  onSwitchToGuided: () => void
  onNewProject: () => void
}

// View steps use a full overlay; action steps open the right drawer
const VIEW_STEPS   = new Set<PipelineStep>(['analyze', 'correlation', 'evaluation'])
const DRAWER_STEPS = new Set<PipelineStep>(['missing-values', 'outliers', 'encoding', 'scaling', 'training'])

const STEP_STATUS_TEXT: Partial<Record<PipelineStep, string>> = {
  'missing-values': 'Select a handling strategy and click Apply & Update Preview.',
  'outliers':       'Review detected outliers and choose an action.',
  'encoding':       'Select columns to encode and choose a method.',
  'scaling':        'Select numeric columns and choose a scaler.',
  'training':       'Configure your model and start training.',
  'evaluation':     'Review model performance metrics.',
  'correlation':    'Inspect the Pearson correlation matrix.',
  'export':         'Export your trained model and results.',
}

export default function FreestyleLayout({
  projectId,
  currentStep,
  onStepChange,
  onPageChange,
  onSwitchToGuided,
  onNewProject,
}: FreestyleLayoutProps) {
  const [openDrawerStep, setOpenDrawerStep] = useState<PipelineStep | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<PipelineStep>>(new Set())

  // Show upload modal until first file is loaded
  const showUpload = currentStep === 'upload'

  const handleUploadDone = () => {
    // Dismiss upload modal, land on table — no analyze step
    onStepChange('missing-values')
  }

  const handleUploadCancel = () => {
    // Go back to guided/dashboard
    onSwitchToGuided()
    onPageChange('dashboard')
  }

  const handleStepSelect = (step: PipelineStep) => {
    onStepChange(step)
    if (VIEW_STEPS.has(step)) {
      // TODO: open full-screen overlay for view steps (analyze, correlation, evaluation)
      setOpenDrawerStep(null)
    } else if (DRAWER_STEPS.has(step)) {
      setOpenDrawerStep(step)
    } else {
      setOpenDrawerStep(null)
    }
  }

  const handleApplied = () => {
    if (openDrawerStep) {
      setCompletedSteps(prev => new Set(prev).add(openDrawerStep))
    }
  }

  const statusText = openDrawerStep
    ? (STEP_STATUS_TEXT[openDrawerStep] ?? '')
    : 'Select a pipeline step from the dropdown above to get started.'

  return (
    <div
      className="bg-[#0d1117]"
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}
    >
      {/* z-30 ensures the topbar + its dropdowns paint above the sticky table header (z-10) */}
      <div style={{ position: 'relative', zIndex: 30, flexShrink: 0 }}>
        <FreestyleTopBar
          projectId={projectId}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepSelect={handleStepSelect}
          onPageChange={onPageChange}
          onNewProject={onNewProject}
        />
      </div>

      {/* Main area: table + optional right drawer */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', zIndex: 0 }}>
        <FreestyleDataTable
          projectId={projectId}
          activeStep={openDrawerStep}
        />

        {openDrawerStep && DRAWER_STEPS.has(openDrawerStep) && (
          <FreestyleDrawer
            projectId={projectId}
            step={openDrawerStep}
            onClose={() => setOpenDrawerStep(null)}
            onApplied={handleApplied}
          />
        )}
      </div>

      <FreestyleBottomBar
        statusText={statusText}
        onSwitchToGuided={onSwitchToGuided}
      />

      {/* Upload modal — shown until dataset is loaded */}
      {showUpload && (
        <FreestyleUploadModal
          projectId={projectId}
          onDone={handleUploadDone}
          onCancel={handleUploadCancel}
        />
      )}
    </div>
  )
}
