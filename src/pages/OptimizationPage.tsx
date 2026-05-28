import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { modelApi } from '../services/api/model'
import type { PipelineStep } from '../types'

interface OptimizationPageProps {
  projectId: string
  onNext: (step: PipelineStep) => void
}

type Strategy = 'Bayesian Optimization' | 'Grid Search' | 'Random Search'

const STRATEGIES: Strategy[] = ['Bayesian Optimization', 'Grid Search', 'Random Search']

const HYPERPARAMS = [
  { key: 'max_depth', label: 'Max Depth', min: 2, max: 12, step: 1, default: 6 },
  { key: 'learning_rate', label: 'Learning Rate', min: 0.01, max: 0.3, step: 0.01, default: 0.1 },
  { key: 'n_estimators', label: 'N Estimators', min: 50, max: 500, step: 50, default: 100 },
  { key: 'subsample', label: 'Subsample', min: 0.5, max: 1.0, step: 0.1, default: 0.8 },
  { key: 'colsample_bytree', label: 'Col Sample / Tree', min: 0.5, max: 1.0, step: 0.1, default: 0.8 },
]

export default function OptimizationPage({ projectId, onNext }: OptimizationPageProps) {
  const [strategy, setStrategy] = useState<Strategy>('Bayesian Optimization')
  const [maxTrials, setMaxTrials] = useState(20)
  const [strategyOpen, setStrategyOpen] = useState(false)
  const [paramValues, setParamValues] = useState<Record<string, number>>(
    Object.fromEntries(HYPERPARAMS.map(p => [p.key, p.default]))
  )

  const { data: evalData, isLoading } = useQuery({
    queryKey: ['evaluate', projectId],
    queryFn: () => modelApi.evaluate(projectId),
    enabled: !!projectId,
  })

  const fmt = (v: number) => `${(v * 100).toFixed(1)}%`

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '64px' }}>
      <div className="p-6">
        <div className="mb-6">
          <p className="text-sm text-[#64748b]">Fine-tune hyperparameters to improve model performance beyond the baseline.</p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Config */}
          <div className="space-y-4">
            <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5">
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-4">Optimization Strategy</p>

              <div className="relative mb-4">
                <button onClick={() => setStrategyOpen(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1c2333] border border-[#2d3748] rounded text-sm text-[#e2e8f0] hover:border-[#374151]">
                  {strategy}
                  <ChevronDown size={14} className="text-[#64748b]" />
                </button>
                {strategyOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c2333] border border-[#2d3748] rounded shadow-xl z-20">
                    {STRATEGIES.map(s => (
                      <button key={s} onClick={() => { setStrategy(s); setStrategyOpen(false) }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-[#f9731618] hover:text-[#f97316] ${strategy === s ? 'text-[#f97316] bg-[#f9731610]' : 'text-[#94a3b8]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-2">Max Trials</p>
              <input type="number" value={maxTrials} min={5} max={100}
                onChange={e => setMaxTrials(parseInt(e.target.value) || 20)}
                className="w-full px-3 py-2.5 bg-[#1c2333] border border-[#2d3748] rounded text-sm text-[#e2e8f0] focus:outline-none focus:border-[#f97316] mb-4" />

              <div className="p-3 bg-[#f9731610] border border-[#f9731640] rounded-lg">
                <p className="text-xs text-[#f97316] font-semibold mb-1">Coming Soon</p>
                <p className="text-[11px] text-[#f97316]/70">Automated hyperparameter optimization via Celery is in development. Configure parameters manually below.</p>
              </div>
            </div>

            {/* Hyperparameter sliders */}
            <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5">
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-4">Hyperparameter Range</p>
              <div className="space-y-4">
                {HYPERPARAMS.map(p => (
                  <div key={p.key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-[#94a3b8]">{p.label}</label>
                      <span className="text-xs font-mono text-[#f97316]">{paramValues[p.key]}</span>
                    </div>
                    <input type="range" min={p.min} max={p.max} step={p.step} value={paramValues[p.key]}
                      onChange={e => setParamValues(prev => ({ ...prev, [p.key]: parseFloat(e.target.value) }))}
                      className="w-full" />
                    <div className="flex justify-between text-[10px] text-[#374151]">
                      <span>{p.min}</span><span>{p.max}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Current best model */}
          <div className="space-y-4">
            <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5">
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-4">Current Best Model</p>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-[#1e2a3a] rounded animate-pulse" />)}
                </div>
              ) : evalData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-[#1e2a3a]">
                    <span className="text-xs text-[#64748b]">Model</span>
                    <span className="text-xs font-mono text-[#e2e8f0]">{evalData.best_model}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1e2a3a]">
                    <span className="text-xs text-[#64748b]">Task</span>
                    <span className="text-xs font-mono text-[#e2e8f0]">{evalData.problem_type}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1e2a3a]">
                    <span className="text-xs text-[#64748b]">Accuracy</span>
                    <span className="text-lg font-bold text-[#22c55e]">{fmt(evalData.accuracy)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1e2a3a]">
                    <span className="text-xs text-[#64748b]">F1-Score</span>
                    <span className="text-sm font-mono text-[#38bdf8]">{fmt(evalData.f1_score)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1e2a3a]">
                    <span className="text-xs text-[#64748b]">Precision</span>
                    <span className="text-sm font-mono text-[#94a3b8]">{fmt(evalData.precision)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-[#64748b]">Recall</span>
                    <span className="text-sm font-mono text-[#94a3b8]">{fmt(evalData.recall)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#64748b]">No trained models found. Complete the Training step first.</p>
              )}
            </div>

            {/* All models */}
            {evalData?.results && evalData.results.length > 0 && (
              <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5">
                <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-3">Trained Models</p>
                <div className="space-y-2">
                  {evalData.results.map(r => (
                    <div key={r.model} className={`flex items-center justify-between px-3 py-2 rounded border ${r.model === evalData.best_model ? 'border-[#f97316] bg-[#f9731608]' : 'border-[#1e2a3a]'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#e2e8f0]">{r.model}</span>
                        {r.model === evalData.best_model && <span className="text-[9px] px-1 py-0.5 bg-[#f97316] text-white rounded">BEST</span>}
                      </div>
                      <span className="text-xs font-mono text-[#22c55e]">{fmt(r.metrics?.accuracy ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 bg-[#111827] border-t border-white/[0.06] flex items-center justify-between px-6 z-10"
        style={{ left: '220px', right: 0, height: '56px' }}>
        <span className="text-sm text-white/40">
          {evalData ? `Best: ${evalData.best_model} — ${fmt(evalData.accuracy)}` : ''}
        </span>
        <div className="flex gap-3">
          <button className="px-4 py-1.5 text-sm text-[#94a3b8] hover:text-white">Cancel</button>
          <button onClick={() => onNext('optimization')}
            className="flex items-center gap-2 px-5 py-1.5 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold rounded">
            Finish Pipeline <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
