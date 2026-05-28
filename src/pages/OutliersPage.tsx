import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { datasetApi } from '../services/api/dataset'
import { preprocessingApi } from '../services/api/preprocessing'
import type { PipelineStep } from '../types'

interface OutliersPageProps {
  projectId: string
  onNext: (step: PipelineStep) => void
}

interface OutlierResult {
  col: string
  count: number
  pct: string
}

const METHODS = [
  { label: 'IQR (Interquartile Range)', value: 'iqr' },
  { label: 'Z-Score', value: 'zscore' },
]

export default function OutliersPage({ projectId, onNext }: OutliersPageProps) {
  const [method, setMethod] = useState('iqr')
  const [threshold, setThreshold] = useState('1.5')
  const [methodOpen, setMethodOpen] = useState(false)
  const [detected, setDetected] = useState<OutlierResult[] | null>(null)

  const { data: analyzeData, isLoading } = useQuery({
    queryKey: ['analyze', projectId],
    queryFn: () => datasetApi.analyze(projectId),
    enabled: !!projectId,
  })

  const info = analyzeData?.dataset_info
  const categoricalSet = useMemo(() => new Set(info?.categorical_columns ?? []), [info])
  const numericCols = useMemo(
    () => (info?.columns ?? []).filter(c => !categoricalSet.has(c)),
    [info, categoricalSet]
  )

  const detectMutation = useMutation({
    mutationFn: () =>
      preprocessingApi.detectOutliers(projectId, {
        method,
        factor: parseFloat(threshold) || undefined,
      }),
    onSuccess: (data) => {
      const rows: OutlierResult[] = Object.entries(data.outlier_results)
        .filter(([, v]) => v.count > 0)
        .map(([col, v]) => ({
          col,
          count: v.count,
          pct: info ? ((v.count / info.shape[0]) * 100).toFixed(2) + '%' : '—',
        }))
      setDetected(rows)
      if (rows.length === 0) toast.success('No outliers detected')
      else toast.success(`${rows.length} column(s) have outliers`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const applyMutation = useMutation({
    mutationFn: () =>
      preprocessingApi.outliers(projectId, {
        method,
        factor: parseFloat(threshold) || undefined,
      }),
    onSuccess: () => {
      toast.success('Outliers handled')
      onNext('encoding')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const displayRows = detected ?? (numericCols.map(col => ({ col, count: 0, pct: '—' })))
  const totalOutliers = detected?.reduce((s, r) => s + r.count, 0) ?? 0

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '64px' }}>
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-4">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-1">Numeric Columns</p>
            <p className="text-3xl font-bold text-white">{isLoading ? '—' : numericCols.length}</p>
          </div>
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-4">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-1">Outliers Detected</p>
            <p className="text-3xl font-bold text-white">{detected ? totalOutliers.toLocaleString() : '—'}</p>
          </div>
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-4">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-1">Columns Affected</p>
            <p className="text-3xl font-bold text-white">{detected ? detected.length : '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-5">
          {/* Settings */}
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5">
            <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-4">Detection Settings</p>

            <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-2">Detection Method</p>
            <div className="relative mb-4">
              <button onClick={() => setMethodOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1c2333] border border-[#2d3748] rounded text-sm text-[#e2e8f0] hover:border-[#374151]">
                {METHODS.find(m => m.value === method)?.label}
                <ChevronDown size={14} className="text-[#64748b]" />
              </button>
              {methodOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c2333] border border-[#2d3748] rounded shadow-xl z-20">
                  {METHODS.map(m => (
                    <button key={m.value} onClick={() => { setMethod(m.value); setMethodOpen(false) }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[#f9731618] hover:text-[#f97316] transition-colors ${method === m.value ? 'text-[#f97316] bg-[#f9731610]' : 'text-[#94a3b8]'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-2">Threshold</p>
            <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#1c2333] border border-[#2d3748] rounded text-sm text-[#e2e8f0] focus:outline-none focus:border-[#f97316] mb-1" />
            <p className="text-[10px] text-[#64748b] font-mono mb-4">Default: 1.5 IQR / 3.0 Z-score</p>

            <button onClick={() => detectMutation.mutate()} disabled={detectMutation.isPending || isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors">
              {detectMutation.isPending
                ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Detecting…</>
                : <><BarChart2 size={15} /> Detect Outliers</>}
            </button>
          </div>

          {/* Results preview */}
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5">
            <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-4">
              {detected ? 'Detection Results' : 'Numeric Columns'}
            </p>
            {isLoading ? (
              <p className="text-sm text-[#64748b]">Loading…</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {numericCols.length === 0 ? (
                  <p className="text-sm text-[#64748b]">No numeric columns found.</p>
                ) : (
                  numericCols.map(col => {
                    const res = detected?.find(r => r.col === col)
                    return (
                      <div key={col} className="flex items-center justify-between py-1.5 border-b border-[#1e2a3a]">
                        <span className="text-xs font-mono text-[#e2e8f0]">{col}</span>
                        {res ? (
                          <span className={`text-xs font-mono ${res.count > 0 ? 'text-[#f97316]' : 'text-[#22c55e]'}`}>
                            {res.count > 0 ? `${res.count} outliers (${res.pct})` : 'Clean'}
                          </span>
                        ) : (
                          <span className="text-xs text-[#4a5568]">not detected yet</span>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results table (after detection) */}
        {detected && detected.length > 0 && (
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1e2a3a]">
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest">Outlier Summary — will be clipped to IQR bounds / Z-score threshold</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-[#1e2a3a] bg-[#0d1117]">
                    {['Column Name', 'Outlier Count', 'Percentage'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.filter(r => r.count > 0).map(row => (
                    <tr key={row.col} className="border-b border-[#1e2a3a] hover:bg-[#0d1117]">
                      <td className="px-5 py-3 font-mono text-xs text-[#e2e8f0]">{row.col}</td>
                      <td className="px-5 py-3 text-xs font-mono text-[#f97316]">{row.count.toLocaleString()}</td>
                      <td className="px-5 py-3 text-xs font-mono text-[#94a3b8]">{row.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 bg-[#111827] border-t border-white/[0.06] flex items-center justify-between px-6 z-10"
        style={{ left: '220px', right: 0, height: '56px' }}>
        <span className="text-sm text-white/40">
          {detected ? `${totalOutliers.toLocaleString()} outliers found across ${detected.length} columns` : 'Click Detect to scan for outliers'}
        </span>
        <div className="flex gap-3">
          <button className="px-4 py-1.5 text-sm text-[#94a3b8] hover:text-white">Cancel</button>
          <button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}
            className="flex items-center gap-2 px-5 py-1.5 bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white text-sm font-semibold rounded">
            {applyMutation.isPending ? 'Applying…' : 'Save & Continue'}
            {!applyMutation.isPending && <ChevronRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}
