import clsx from 'clsx'

interface Props {
  title: string
  value: string | number
  unit?: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export default function KPICard({ title, value, unit, sub, className }: Props) {
  return (
    <div className={clsx('card flex flex-col gap-1', className)}>
      <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">{title}</div>
      <div className="flex items-end gap-1.5 mt-1">
        <span className="text-3xl font-bold text-white tabular-nums">{value}</span>
        {unit && <span className="text-sm text-gray-500 mb-1">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-gray-600">{sub}</div>}
    </div>
  )
}
