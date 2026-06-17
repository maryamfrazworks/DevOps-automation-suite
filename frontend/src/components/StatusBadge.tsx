import clsx from 'clsx'
import { STATUS_COLORS } from '../utils/format'

interface Props {
  status: string
  pulse?: boolean
}

export default function StatusBadge({ status, pulse }: Props) {
  return (
    <span className={clsx('badge', STATUS_COLORS[status] ?? 'bg-gray-700 text-gray-300')}>
      {pulse && status === 'running' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
        </span>
      )}
      {status}
    </span>
  )
}
