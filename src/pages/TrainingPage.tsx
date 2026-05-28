import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronDown, Play, Lock, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { datasetApi } from '../services/api/dataset'
import { modelApi } from '../services/api/model'
import type { PipelineStep, TrainMetrics } from '../types'

interface TrainingPageProps {
  projectId: string
  onNext: (step: PipelineStep) => void
}

type ModelType = 'xgboost' | 'random_forest' | 'logistic_regression'

const MODELS = [
  {
    id: 'xgboost' as ModelType,
    label: 'XGBoost',
    description: 'Optimized gradient boosting library designed to be highly efficient and flexible.',
    tags: ['Fast', 'Ensemble'],
    icon: <Zap size={28} className="text-[#f97316]" />,
  },
  {
    id: 'random_forest' as ModelType,
    label: 'Random Forest',
    description: 'Large number of individual decision trees that operate as an ensemble.',
    tags: ['Robust', 'Bagging'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="7" cy="20" r="5" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
        <circle cx="14" cy="10" r="5" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
        <circle cx="21" cy="20" r="5" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  {
    id: 'logistic_regression' as ModelType,
    label: 'Logistic Regression',
    description: 'Simple yet effective linear model for binary classification problems.',
    tags: ['Linear', 'Interpretable'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 20 Q10 18 14 12 Q18 6 24 8" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="14" cy="12" r="2" fill="#94a3b8" />
      </svg>
    ),
  },
]

export default function TrainingPage({ projectId, onNext }: TrainingPageProps) {
  const [selectedModel, setSelectedModel] = useState<ModelType>('xgboost')
  const [targetCol, setTargetCol] = useState<string>('')
  const [trainSplit, setTrainSplit] = useState(80)
  const [targetOpen, setTargetOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [lastMetrics, setLastMetrics] = useState<TrainMetrics | null>(null)

  const { data: analyzeData, isLoading: colsLoading } = useQuery({
    queryKey: ['analyze', projectId],
    queryFn: () => datasetApi.analyze(projectId),
    enabled: !!projectId,
  })

  const allColumns = useMemo(() => {
    const cols = analyzeData?.dataset_info?.columns ?? []
    if (cols.length > 0 && !targetCol) {
      // Default: last column (typically the target)
      setTargetCol(cols[cols.length - 1])
    }
    return cols
  }, [analyzeData, targetCol])

  const trainMutation = useMutation({
    mutationFn: () =>
      modelApi.train(projectId, {
        model_type: selectedModel,
        target_column: targetCol,
        test_size: (100 - trainSplit) / 100,
      }),
    onSuccess: (data) => {
      setLastMetrics(data.metrics)
      toast.success(`Training complete — accuracy: ${(data.metrics.accuracy * 100).toFixed(1)}%`)
      onNext('evaluation')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '64px' }}>
      <div className="flex h-full">
        {/* Main */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <p className="text-sm text-[#64748b]">Define hyperparameters and select the optimal architecture for your dataset.</p>
          </div>

          {/* Target column selector */}
          <div className="bg-[#111827] border border-[#2d3748] rounded-lg p-4 mb-6">
            <p className="text-xs text-[#64748b] mb-2">Target Column</p>
            {colsLoading ? (
              <div className="h-6 w-40 bg-[#1e2a3a] rounded animate-pulse" />
            ) : (
              <div className="relative">
                <button onClick={() => setTargetOpen(v => !v)}
                  className="w-full flex items-center justify-between text-sm text-[#e2e8f0] py-1">
                  {targetCol || 'Select target column…'}
                  <ChevronDown size={14} className="text-[#64748b]" />
                </button>
                {targetOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c2333] border border-[#2d3748] rounded shadow-xl z-20 max-h-48 overflow-y-auto">
                    {allColumns.map(c => (
                      <button key={c} onClick={() => { setTargetCol(c); setTargetOpen(false) }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-[#f9731618] hover:text-[#f97316] transition-colors ${targetCol === c ? 'text-[#f97316]' : 'text-[#94a3b8]'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Model cards */}
          <div className="mb-6">
            <p className="text-sm font-medium text-[#94a3b8] mb-3">Model Architecture</p>
            <div className="grid grid-cols-3 gap-3">
              {MODELS.map(model => (
                <button key={model.id} onClick={() => setSelectedModel(model.id)}
                  className={`relative text-left p-4 rounded-lg border transition-all duration-150 ${selectedModel === model.id ? 'border-[#f97316] bg-[#f9731610]' : 'border-[#1e2a3a] bg-[#111827] hover:border-[#2d3748]'}`}>
                  {selectedModel === model.id && (
                    <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 bg-[#f97316] text-white rounded uppercase font-semibold">Selected</span>
                  )}
                  <div className="mb-3">{model.icon}</div>
                  <p className="text-sm font-semibold text-white mb-1">{model.label}</p>
                  <p className="text-[11px] text-[#64748b] leading-relaxed mb-3">{model.description}</p>
                  <div className="flex gap-1.5">
                    {model.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 text-[10px] bg-[#1c2333] text-[#64748b] border border-[#2d3748] rounded">{t}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Train/Test Split + Start button */}
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[#94a3b8]">Train / Test Split</p>
              <span className="text-sm font-mono text-[#f97316]">{trainSplit}% / {100 - trainSplit}%</span>
            </div>
            <div className="flex items-center gap-4">
              <input type="range" min="60" max="90" step="5" value={trainSplit}
                onChange={e => setTrainSplit(parseInt(e.target.value))} className="flex-1" />
              <button onClick={() => trainMutation.mutate()}
                disabled={trainMutation.isPending || !targetCol}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-60 text-white text-sm font-semibold rounded transition-colors">
                {trainMutation.isPending ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Training…</>
                ) : (
                  <><Play size={14} fill="white" />Start Training</>
                )}
              </button>
            </div>
            {lastMetrics && (
              <div className="mt-3 pt-3 border-t border-[#1e2a3a] flex gap-6">
                <span className="text-xs text-[#64748b]">Accuracy: <span className="text-[#22c55e] font-mono">{(lastMetrics.accuracy * 100).toFixed(1)}%</span></span>
                {lastMetrics.f1_score != null && <span className="text-xs text-[#64748b]">F1: <span className="text-[#38bdf8] font-mono">{(lastMetrics.f1_score * 100).toFixed(1)}%</span></span>}
                {lastMetrics.precision != null && <span className="text-xs text-[#64748b]">Precision: <span className="text-[#94a3b8] font-mono">{(lastMetrics.precision * 100).toFixed(1)}%</span></span>}
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg overflow-hidden">
            <button onClick={() => setAdvancedOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm text-[#94a3b8] hover:text-white transition-colors">
              Advanced Settings
              <ChevronDown size={14} className={`transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </button>
            {advancedOpen && (
              <div className="px-5 pb-5 grid grid-cols-2 gap-4 border-t border-[#1e2a3a] pt-4">
                {[
                  { label: 'Max Depth', value: '6' },
                  { label: 'Learning Rate', value: '0.1' },
                  { label: 'N Estimators', value: '100' },
                  { label: 'Subsample', value: '0.8' },
                ].map(p => (
                  <div key={p.label}>
                    <label className="text-[10px] text-[#64748b] uppercase tracking-widest block mb-1">{p.label}</label>
                    <input type="text" defaultValue={p.value}
                      className="w-full px-3 py-2 bg-[#1c2333] border border-[#2d3748] rounded text-sm text-[#e2e8f0] focus:outline-none focus:border-[#f97316]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 border-l border-[#1e2a3a] p-5 flex flex-col gap-5">
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest">AI Suggestions</p>
              <span className="px-2 py-0.5 text-[10px] font-semibold text-[#f97316] bg-[#f9731620] rounded uppercase">PRO</span>
            </div>
            <div className="flex flex-col items-center py-4">
              <div className="w-14 h-14 rounded-xl bg-[#1c2333] border border-[#2d3748] flex items-center justify-center mb-3">
                <Lock size={22} className="text-[#38bdf8]" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">Unlock Insights</p>
              <p className="text-[11px] text-[#64748b] text-center mb-4 leading-relaxed">Our AI analyzes your feature set and recommends optimal hyperparameters.</p>
              <button className="w-full py-2 border border-[#f97316] text-[#f97316] text-xs font-semibold rounded hover:bg-[#f9731610]">Upgrade to Pro</button>
            </div>
          </div>

          {allColumns.length > 0 && (
            <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-4">
              <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-2">Dataset</p>
              <p className="text-sm text-white">{allColumns.length} columns</p>
              <p className="text-xs text-[#64748b] mt-1">Target: <span className="text-[#f97316]">{targetCol}</span></p>
            </div>
          )}

          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-4 opacity-40">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-[#64748b] uppercase tracking-widest">Recommended Model</p>
              <span className="px-1.5 py-0.5 text-[9px] font-semibold text-[#f97316] bg-[#f9731620] rounded uppercase">PRO</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#64748b]" />
              <span className="text-sm text-[#64748b]">Deep Ensemble</span>
              <Lock size={12} className="text-[#374151] ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
