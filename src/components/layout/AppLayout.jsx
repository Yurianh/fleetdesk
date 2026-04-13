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

  // Prefetch all core data so every page gets cache hits on mount.
  // isPending (not isLoading) catches the state where no cached data exists yet,
  // even before the fetch has started — preventing any zero-flash on refresh.
  const { isPending: p1 } = useVehicles()
  const { isPending: p2 } = useDrivers()
  const { isPending: p3 } = useAssignments()
  const { isPending: p4 } = useMileageEntries()
  const { isPending: p5 } = useMaintenanceRecords()
  const { isPending: p6 } = useMaintenanceSchedules()
  const { isPending: p7 } = useTechnicalInspections()
  const { isPending: p8 } = useWashRecords()
  const { isPending: p9 } = useAllDriverDocuments()

  if (p1 || p2 || p3 || p4 || p5 || p6 || p7 || p8 || p9) return <AppLoader />

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
