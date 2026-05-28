import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Footer from './components/Footer'
import UploadPage from './pages/UploadPage'
import AnalyzePage from './pages/AnalyzePage'
import MissingValuesPage from './pages/MissingValuesPage'
import OutliersPage from './pages/OutliersPage'
import EncodingPage from './pages/EncodingPage'
import CorrelationPage from './pages/CorrelationPage'
import ScalingPage from './pages/ScalingPage'
import TrainingPage from './pages/TrainingPage'
import EvaluationPage from './pages/EvaluationPage'
import OptimizationPage from './pages/OptimizationPage'
import SettingsPage from './pages/SettingsPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import type { AppPage, PipelineStep } from './types'

const STEP_TITLES: Record<PipelineStep, string> = {
  upload: 'Upload Dataset',
  analyze: 'Dataset Analysis',
  'missing-values': 'Missing Values',
  outliers: 'Outliers Detection',
  encoding: 'Feature Encoding',
  correlation: 'Feature Correlation',
  scaling: 'Feature Scaling',
  training: 'Model Training',
  evaluation: 'Model Evaluation',
  optimization: 'Hyperparameter Optimization',
}

const STEP_BADGES: Partial<Record<PipelineStep, string>> = {}

export default function App() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard')
  const [currentStep, setCurrentStep] = useState<PipelineStep>('upload')
  const [authPage, setAuthPage] = useState<'landing' | 'login' | 'register' | 'reset'>('landing')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#f97316] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#64748b]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (authPage === 'landing') {
      return <LandingPage onNavigate={setAuthPage} />
    }
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col overflow-y-auto">
        {authPage === 'login' && <LoginPage onNavigate={setAuthPage} />}
        {authPage === 'register' && <RegisterPage onNavigate={setAuthPage} />}
        {authPage === 'reset' && <ResetPasswordPage onNavigate={setAuthPage} />}
      </div>
    )
  }

  const handlePageChange = (page: AppPage) => {
    setCurrentPage(page)
  }

  const handleStepChange = (step: PipelineStep) => {
    setCurrentStep(step)
    setCurrentPage('pipeline')
  }

  const handleOpenProject = (projectId: string, step: PipelineStep = 'upload') => {
    setActiveProjectId(projectId)
    setCurrentStep(step)
    setCurrentPage('pipeline')
  }

  const handleNext = (step: PipelineStep) => {
    setCurrentStep(step)
  }

  const getPageTitle = (): string => {
    if (currentPage === 'dashboard') return 'Dashboard'
    if (currentPage === 'settings') return 'Settings'
    if (currentPage === 'projects') return 'Projects'
    return STEP_TITLES[currentStep]
  }

  const getPageBadge = (): string | undefined => {
    if (currentPage === 'pipeline') return STEP_BADGES[currentStep]
    return undefined
  }

  const renderContent = () => {
    if (currentPage === 'dashboard') {
      return (
        <DashboardPage
          onPageChange={handlePageChange}
          onStepChange={handleStepChange}
          onOpenProject={handleOpenProject}
        />
      )
    }
    if (currentPage === 'settings') {
      return <SettingsPage />
    }
    if (currentPage === 'projects') {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#64748b] text-sm">Projects view coming soon</p>
            <button
              onClick={() => handlePageChange('dashboard')}
              className="mt-3 text-xs text-[#f97316] hover:underline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )
    }
    const projectId = activeProjectId ?? ''
    switch (currentStep) {
      case 'upload': return <UploadPage projectId={projectId} onNext={handleNext} />
      case 'analyze': return <AnalyzePage projectId={projectId} onNext={handleNext} />
      case 'missing-values': return <MissingValuesPage projectId={projectId} onNext={handleNext} />
      case 'outliers': return <OutliersPage projectId={projectId} onNext={handleNext} />
      case 'encoding': return <EncodingPage projectId={projectId} onNext={handleNext} />
      case 'correlation': return <CorrelationPage projectId={projectId} onNext={handleNext} />
      case 'scaling': return <ScalingPage projectId={projectId} onNext={handleNext} />
      case 'training': return <TrainingPage projectId={projectId} onNext={handleNext} />
      case 'evaluation': return <EvaluationPage projectId={projectId} onNext={handleNext} />
      case 'optimization': return <OptimizationPage projectId={projectId} onNext={handleNext} />
    }
  }

  return (
    <div className="bg-[#0d1117]" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        currentPage={currentPage}
        currentStep={currentStep}
        onPageChange={handlePageChange}
        onStepChange={handleStepChange}
      />
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'hidden' }}>
        <TopBar
          title={getPageTitle()}
          badge={getPageBadge()}
          onNewProject={() => { handlePageChange('dashboard') }}
        />
        <main style={{ flex: 1, height: '100%', overflowY: 'auto', minWidth: 0 }}>
          {renderContent()}
        </main>
        <Footer />
      </div>
    </div>
  )
}
