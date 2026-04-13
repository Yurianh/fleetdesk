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

  // Prefetch all core data before rendering any page.
  // Wait for isSuccess OR isError on every query so the loader never
  // blocks forever on a network failure, and never flashes on refresh.
  const { isSuccess: s1, isError: e1 } = useVehicles()
  const { isSuccess: s2, isError: e2 } = useDrivers()
  const { isSuccess: s3, isError: e3 } = useAssignments()
  const { isSuccess: s4, isError: e4 } = useMileageEntries()
  const { isSuccess: s5, isError: e5 } = useMaintenanceRecords()
  const { isSuccess: s6, isError: e6 } = useMaintenanceSchedules()
  const { isSuccess: s7, isError: e7 } = useTechnicalInspections()
  const { isSuccess: s8, isError: e8 } = useWashRecords()
  const { isSuccess: s9, isError: e9 } = useAllDriverDocuments()

  const appReady = (s1||e1) && (s2||e2) && (s3||e3) && (s4||e4) && (s5||e5)
                && (s6||e6) && (s7||e7) && (s8||e8) && (s9||e9)

  if (!appReady) return <AppLoader />

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
