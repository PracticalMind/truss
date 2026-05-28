import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { datasetApi } from '../services/api/dataset'
import { preprocessingApi } from '../services/api/preprocessing'
import type { PipelineStep } from '../types'

interface ScalingPageProps {
  projectId: string
  onNext: (step: PipelineStep) => void
}

type ScalerType = 'standard' | 'minmax' | 'robust'

const SCALERS: { type: ScalerType; label: string; description: string; bestFor: string; recommended?: boolean }[] = [
  { type: 'standard', label: 'Standard', description: 'Removes mean and scales to unit variance. Assumes Gaussian distribution.', bestFor: 'Linear algorithms', recommended: true },
  { type: 'minmax', label: 'Min-Max', description: 'Scales features to a specific range [0, 1].', bestFor: 'Neural Networks' },
  { type: 'robust', label: 'Robust', description: 'Uses median and quartiles. Robust to extreme outliers.', bestFor: 'Noisy Data' },
]

export default function ScalingPage({ projectId, onNext }: ScalingPageProps) {
  const [selectedScaler, setSelectedScaler] = useState<ScalerType>('standard')
  const [selectedCols, setSelectedCols] = useState<Set<string> | null>(null) // null = all

  const { data: analyzeData, isLoading } = useQuery({
    queryKey: ['analyze', projectId],
    queryFn: () => datasetApi.analyze(projectId),
    enabled: !!projectId,
  })

  const info = analyzeData?.dataset_info
  const analysis = analyzeData?.analysis ?? []
  const categoricalSet = useMemo(() => new Set(info?.categorical_columns ?? []), [info])
  const numericCols = useMemo(
    () => (info?.columns ?? []).filter(c => !categoricalSet.has(c)),
    [info, categoricalSet]
  )

  // Initialize selectedCols when data loads
  const effectiveSelected = selectedCols ?? new Set(numericCols)

  const toggleCol = (col: string) => {
    const next = new Set(effectiveSelected)
    next.has(col) ? next.delete(col) : next.add(col)
    setSelectedCols(next)
  }

  const toggleAll = () => {
    if (effectiveSelected.size === numericCols.length) {
      setSelectedCols(new Set())
    } else {
      setSelectedCols(new Set(numericCols))
    }
  }

  const applyMutation = useMutation({
    mutationFn: () => {
      const cols = [...effectiveSelected]
      return preprocessingApi.scaling(projectId, {
        method: selectedScaler,
        columns: cols.length === numericCols.length ? null : cols,
      })
    },
    onSuccess: () => {
      toast.success('Scaling applied')
      onNext('training')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const getColStats = (col: string) => {
    const stat = analysis.find(a => a.column === col)
    if (!stat || stat.type !== 'numeric') return { min: '—', max: '—' }
    return {
      min: stat.min?.toFixed(2) ?? '—',
      max: stat.max?.toFixed(2) ?? '—',
    }
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '64px' }}>
      <div className="p-6">
        {/* Info bar */}
        <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#1c2333] border border-[#2d3748] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="5" width="14" height="2" rx="1" fill="#94a3b8" />
                <rect x="1" y="9" width="14" height="2" rx="1" fill="#94a3b8" />
                <rect x="4" y="2" width="2" height="12" rx="1" fill="#f97316" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-[#64748b] uppercase tracking-widest">Numeric Features Detected</p>
              {isLoading
                ? <div className="h-5 w-32 bg-[#1e2a3a] rounded animate-pulse mt-1" />
                : <p className="text-lg font-bold text-white">{numericCols.length} Columns Identified</p>
              }
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#64748b]">Recommended: <span className="text-[#f97316] font-medium">StandardScaler</span></p>
          </div>
        </div>

        {/* Scaler cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {SCALERS.map(scaler => (
            <button key={scaler.type} onClick={() => setSelectedScaler(scaler.type)}
              className={`relative text-left p-4 rounded-lg border transition-all duration-150 ${selectedScaler === scaler.type ? 'border-[#f97316] bg-[#f9731610]' : 'border-[#1e2a3a] bg-[#111827] hover:border-[#2d3748]'}`}>
              {scaler.recommended && (
                <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 bg-[#1e2a3a] text-[#94a3b8] rounded uppercase tracking-wide border border-[#2d3748]">Recommended</span>
              )}
              <div className="mb-3">
                {selectedScaler === scaler.type
                  ? <CheckCircle2 size={16} className="text-[#f97316]" />
                  : <div className="w-4 h-4 rounded-full border-2 border-[#374151]" />}
              </div>
              <p className="text-sm font-semibold text-white mb-1">{scaler.label}</p>
              <p className="text-[11px] text-[#64748b] leading-relaxed mb-3">{scaler.description}</p>
              <div>
                <p className="text-[9px] text-[#4a5568] uppercase tracking-widest">Best For</p>
                <p className="text-xs text-[#94a3b8]">{scaler.bestFor}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Column table */}
        <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1e2a3a] flex items-center justify-between">
            <p className="text-xs font-semibold text-white">Column Selection &amp; Ranges</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#64748b]">{effectiveSelected.size} of {numericCols.length} selected</span>
              <button onClick={toggleAll} className="text-xs text-[#f97316] hover:underline">
                {effectiveSelected.size === numericCols.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-[#1e2a3a] bg-[#0d1117]">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox"
                      checked={effectiveSelected.size === numericCols.length && numericCols.length > 0}
                      onChange={toggleAll} className="w-3.5 h-3.5" />
                  </th>
                  {['Feature Name', 'Min', 'Max'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-[#64748b]">Loading columns…</td></tr>
                )}
                {!isLoading && numericCols.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-[#64748b]">No numeric columns found. Run Encoding step first.</td></tr>
                )}
                {numericCols.map(col => {
                  const { min, max } = getColStats(col)
                  const selected = effectiveSelected.has(col)
                  return (
                    <tr key={col} className={`border-b border-[#1e2a3a] transition-colors ${selected ? 'hover:bg-[#0d1117]' : 'opacity-50'}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected} onChange={() => toggleCol(col)} className="w-3.5 h-3.5" />
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-[#e2e8f0]">{col}</td>
                      <td className="px-3 py-3 text-xs font-mono text-[#64748b]">{min}</td>
                      <td className="px-3 py-3 text-xs font-mono text-[#64748b]">{max}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 bg-[#111827] border-t border-white/[0.06] flex items-center justify-between px-6 z-10"
        style={{ left: '220px', right: 0, height: '56px' }}>
        <span className="text-sm text-white/40">{effectiveSelected.size} columns · {SCALERS.find(s => s.type === selectedScaler)?.label} Scaler</span>
        <div className="flex gap-3">
          <button className="px-4 py-1.5 text-sm text-[#94a3b8] hover:text-white">Cancel</button>
          <button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending || effectiveSelected.size === 0}
            className="flex items-center gap-2 px-5 py-1.5 bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white text-sm font-semibold rounded">
            {applyMutation.isPending ? 'Applying…' : 'Save & Continue'}
            {!applyMutation.isPending && <ChevronRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}
