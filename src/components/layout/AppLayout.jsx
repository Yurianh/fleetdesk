import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import AppLoader from './AppLoader'
import {
  useFleetRealtime,
  useVehicles, useDrivers, useAssignments,
  useMileageEntries, useMaintenanceRecords, useMaintenanceSchedules,
  useTechnicalInspections, useWashRecords, useAllDriverDocuments,
} from '@/lib/useFleetData'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useFleetRealtime()

  // Prefetch all core data so every page gets cache hits on mount
  const { isLoading: l1 } = useVehicles()
  const { isLoading: l2 } = useDrivers()
  const { isLoading: l3 } = useAssignments()
  const { isLoading: l4 } = useMileageEntries()
  const { isLoading: l5 } = useMaintenanceRecords()
  const { isLoading: l6 } = useMaintenanceSchedules()
  const { isLoading: l7 } = useTechnicalInspections()
  const { isLoading: l8 } = useWashRecords()
  const { isLoading: l9 } = useAllDriverDocuments()

  if (l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9) return <AppLoader />

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center h-14 px-4 bg-background border-b border-zinc-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-semibold text-zinc-900">FleetDesk</span>
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
