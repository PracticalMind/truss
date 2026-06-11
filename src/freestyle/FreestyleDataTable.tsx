import { useQuery } from '@tanstack/react-query'
import { datasetApi } from '../services/api/dataset'
import type { PipelineStep } from '../types'

interface FreestyleDataTableProps {
  projectId: string
  activeStep: PipelineStep | null
}

const STEP_AFFECTED_COLS: Partial<Record<PipelineStep, (info: { missing_values: Record<string, number>; categorical_columns: string[] | null }) => string[]>> = {
  'missing-values': (info) => Object.keys(info.missing_values).filter(c => info.missing_values[c] > 0),
  'encoding': (info) => info.categorical_columns ?? [],
}

export default function FreestyleDataTable({ projectId, activeStep }: FreestyleDataTableProps) {
  const { data: analyzeData, isLoading } = useQuery({
    queryKey: ['analyze', projectId],
    queryFn: () => datasetApi.analyze(projectId),
    enabled: !!projectId,
  })

  const columns = analyzeData?.dataset_info.columns ?? []
  const rows = analyzeData?.dataset_info.data ?? []

  const highlightedCols = new Set<string>(
    activeStep && analyzeData
      ? (STEP_AFFECTED_COLS[activeStep]?.(analyzeData.dataset_info) ?? [])
      : []
  )

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-[#64748b]">
        Loading dataset…
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-[#64748b]">
        No data available. Upload a dataset first.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="text-xs w-max min-w-full">
        <thead className="sticky top-0 z-[5]">
          <tr className="bg-[#0d1117] border-b border-[#1e2a3a]">
            <th className="px-3 py-2 text-[10px] font-semibold text-[#374151] uppercase tracking-widest text-right w-10 sticky left-0 bg-[#0d1117]">#</th>
            {columns.map(col => (
              <th
                key={col}
                className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-left whitespace-nowrap"
                style={{
                  color: highlightedCols.has(col) ? '#f97316' : '#4a5568',
                  backgroundColor: highlightedCols.has(col) ? 'rgba(249,115,22,0.06)' : '#0d1117',
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#1e2a3a] hover:bg-white/[0.02]">
              <td className="px-3 py-1.5 text-[#2d3748] text-right font-mono sticky left-0 bg-[#0d1117]">{i + 1}</td>
              {(row as unknown[]).map((val, j) => {
                const col = columns[j]
                const isHighlighted = highlightedCols.has(col)
                const isNull = val === null || val === undefined || val === ''
                return (
                  <td
                    key={j}
                    className="px-3 py-1.5 font-mono whitespace-nowrap max-w-[160px] truncate"
                    style={{ backgroundColor: isHighlighted ? 'rgba(249,115,22,0.04)' : undefined }}
                  >
                    {isNull ? (
                      <span className="text-[#f97316] italic opacity-70">null</span>
                    ) : (
                      <span className="text-[#94a3b8]">{String(val)}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
