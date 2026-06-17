import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Deployments, { DeploymentDetail } from './pages/Deployments'
import Incidents from './pages/Incidents'
import Pipelines from './pages/Pipelines'
import Metrics from './pages/Metrics'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          {/* Top bar */}
          <div className="h-12 border-b border-gray-800 flex items-center px-6 gap-3 shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
            <span className="text-xs text-gray-500">API connected · auto-refreshing</span>
          </div>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/deployments" element={<Deployments />} />
            <Route path="/deployments/:id" element={<DeploymentDetail />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/pipelines" element={<Pipelines />} />
            <Route path="/metrics" element={<Metrics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
