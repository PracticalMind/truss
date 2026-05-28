import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { datasetApi } from '../services/api/dataset'
import { preprocessingApi } from '../services/api/preprocessing'
import type { PipelineStep } from '../types'

interface EncodingPageProps {
  projectId: string
  onNext: (step: PipelineStep) => void
}

type EncodingMethod = 'onehot' | 'label' | 'ordinal'

const METHODS: { label: string; value: EncodingMethod; description: string }[] = [
  { label: 'One-Hot', value: 'onehot', description: 'Creates binary columns for each category. Best for nominal data.' },
  { label: 'Label', value: 'label', description: 'Assigns integer labels. Best for tree-based models.' },
  { label: 'Ordinal', value: 'ordinal', description: 'Preserves order relationships between categories.' },
]

export default function EncodingPage({ projectId, onNext }: EncodingPageProps) {
  const [method, setMethod] = useState<EncodingMethod>('label')
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})

  // Per-column method override
  const [colMethods, setColMethods] = useState<Record<string, EncodingMethod>>({})

  const { data: analyzeData, isLoading } = useQuery({
    queryKey: ['analyze', projectId],
    queryFn: () => datasetApi.analyze(projectId),
    enabled: !!projectId,
  })

  const info = analyzeData?.dataset_info
  const analysis = analyzeData?.analysis ?? []

  const categoricalCols = useMemo(() => info?.categorical_columns ?? [], [info])

  const colStats = useMemo(() => {
    return categoricalCols.map(col => {
      const stat = analysis.find(a => a.column === col)
      return {
        name: col,
        unique: stat?.unique_values ?? 0,
        mostFrequent: String(stat?.most_frequent ?? '—'),
        colMethod: colMethods[col] ?? method,
      }
    })
  }, [categoricalCols, analysis, colMethods, method])

  const applyMutation = useMutation({
    mutationFn: () =>
      preprocessingApi.encoding(projectId, { method }),
    onSuccess: () => {
      toast.success('Encoding applied')
      onNext('correlation')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleDropdown = (col: string) => {
    setOpenDropdowns(prev => ({ ...prev, [col]: !prev[col] }))
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '64px' }}>
      <div className="p-6">
        <div className="mb-6">
          <p className="text-sm text-[#64748b]">Configure encoding strategies for categorical features.</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-4">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-1">Categorical Columns</p>
            {isLoading ? <div className="h-8 w-12 bg-[#1e2a3a] rounded animate-pulse" /> : (
              <p className="text-2xl font-bold text-white">{categoricalCols.length}</p>
            )}
          </div>
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-4">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-1">Method</p>
            <p className="text-xl font-bold text-[#f97316]">{METHODS.find(m => m.value === method)?.label}</p>
          </div>
          <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-4">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-1">Total Columns</p>
            {isLoading ? <div className="h-8 w-12 bg-[#1e2a3a] rounded animate-pulse" /> : (
              <p className="text-2xl font-bold text-white">{info?.columns.length ?? 0}</p>
            )}
          </div>
        </div>

        {/* Global method selector */}
        <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5 mb-5">
          <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-3">Global Encoding Method</p>
          <div className="grid grid-cols-3 gap-3">
            {METHODS.map(m => (
              <button key={m.value} onClick={() => setMethod(m.value)}
                className={`text-left p-4 rounded-lg border transition-all ${method === m.value ? 'border-[#f97316] bg-[#f9731610]' : 'border-[#1e2a3a] hover:border-[#2d3748]'}`}>
                <p className="text-sm font-semibold text-white mb-1">{m.label}</p>
                <p className="text-[11px] text-[#64748b] leading-relaxed">{m.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Encoding Table */}
        <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1e2a3a]">
            <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest">Categorical Columns Preview</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-[#1e2a3a] bg-[#0d1117]">
                  {['Column Name', 'Unique Values', 'Most Frequent', 'Method'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-[#64748b]">Loading columns…</td></tr>
                )}
                {!isLoading && categoricalCols.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-[#64748b]">No categorical columns found.</td></tr>
                )}
                {colStats.map(col => (
                  <tr key={col.name} className="border-b border-[#1e2a3a] hover:bg-[#0d1117]">
                    <td className="px-5 py-3 font-mono text-xs text-[#e2e8f0]">{col.name}</td>
                    <td className="px-5 py-3 text-xs font-mono text-[#94a3b8]">{col.unique.toLocaleString()}</td>
                    <td className="px-5 py-3 text-xs text-[#64748b] font-mono truncate max-w-[120px]">{col.mostFrequent}</td>
                    <td className="px-5 py-3">
                      <div className="relative">
                        <button onClick={() => toggleDropdown(col.name)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#1c2333] border border-[#2d3748] rounded text-xs text-[#e2e8f0] hover:border-[#374151] min-w-[100px] justify-between">
                          {METHODS.find(m => m.value === col.colMethod)?.label}
                          <ChevronDown size={11} className="text-[#64748b]" />
                        </button>
                        {openDropdowns[col.name] && (
                          <div className="absolute top-full left-0 mt-1 w-36 bg-[#1c2333] border border-[#2d3748] rounded shadow-xl z-20">
                            {METHODS.map(m => (
                              <button key={m.value}
                                onClick={() => { setColMethods(prev => ({ ...prev, [col.name]: m.value })); toggleDropdown(col.name) }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-[#f9731618] hover:text-[#f97316] ${col.colMethod === m.value ? 'text-[#f97316] bg-[#f9731610]' : 'text-[#94a3b8]'}`}>
                                {m.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {method === 'onehot' && categoricalCols.length > 0 && (
          <div className="mt-4 flex items-start gap-3 p-3 bg-white/[0.04] border border-white/[0.08] rounded-lg">
            <Info size={14} className="text-[#64748b] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#64748b]">
              One-Hot encoding will create new binary columns for each unique category value. Original categorical columns will be dropped.
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 bg-[#111827] border-t border-white/[0.06] flex items-center justify-between px-6 z-10"
        style={{ left: '220px', right: 0, height: '56px' }}>
        <span className="text-sm text-white/40">{categoricalCols.length} categorical columns · {METHODS.find(m => m.value === method)?.label}</span>
        <div className="flex gap-3">
          <button className="px-4 py-1.5 text-sm text-[#94a3b8] hover:text-white">Cancel</button>
          <button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending || categoricalCols.length === 0}
            className="flex items-center gap-2 px-5 py-1.5 bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white text-sm font-semibold rounded">
            {applyMutation.isPending ? 'Applying…' : 'Save & Continue'}
            {!applyMutation.isPending && <ChevronRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}
