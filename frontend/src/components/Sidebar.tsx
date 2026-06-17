import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Rocket, AlertTriangle, GitBranch, BarChart3, Activity
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/deployments', label: 'Deployments', icon: Rocket },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/pipelines', label: 'Pipelines', icon: GitBranch },
  { to: '/metrics', label: 'Metrics', icon: BarChart3 },
]

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <Activity size={16} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white leading-none">DevOps Suite</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Automation Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-800 text-xs text-gray-600">
        v1.0.0 · <a href="/api/docs" className="hover:text-gray-400 transition-colors" target="_blank" rel="noreferrer">API Docs →</a>
      </div>
    </aside>
  )
}
