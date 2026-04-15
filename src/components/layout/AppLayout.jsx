import { useState, useEffect, useRef } from 'react'
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
  const [loaderFading, setLoaderFading] = useState(false)
  const [loaderGone, setLoaderGone] = useState(false)
  const mountedAt = useRef(Date.now())
  useFleetRealtime()

  const { isSuccess: s1, isError: e1, isPlaceholderData: p1 } = useVehicles()
  const { isSuccess: s2, isError: e2, isPlaceholderData: p2 } = useDrivers()
  const { isSuccess: s3, isError: e3, isPlaceholderData: p3 } = useAssignments()
  const { isSuccess: s4, isError: e4, isPlaceholderData: p4 } = useMileageEntries()
  const { isSuccess: s5, isError: e5, isPlaceholderData: p5 } = useMaintenanceRecords()
  const { isSuccess: s6, isError: e6, isPlaceholderData: p6 } = useMaintenanceSchedules()
  const { isSuccess: s7, isError: e7, isPlaceholderData: p7 } = useTechnicalInspections()
  const { isSuccess: s8, isError: e8, isPlaceholderData: p8 } = useWashRecords()
  const { isSuccess: s9, isError: e9, isPlaceholderData: p9 } = useAllDriverDocuments()

  // True only when each query has real network data (not placeholderData) or has errored
  const allSettled = ((s1&&!p1)||e1) && ((s2&&!p2)||e2) && ((s3&&!p3)||e3)
                  && ((s4&&!p4)||e4) && ((s5&&!p5)||e5) && ((s6&&!p6)||e6)
                  && ((s7&&!p7)||e7) && ((s8&&!p8)||e8) && ((s9&&!p9)||e9)

  useEffect(() => {
    if (!allSettled) return
    const remaining = Math.max(0, 600 - (Date.now() - mountedAt.current))
    const t = setTimeout(() => {
      setLoaderFading(true)
      setTimeout(() => setLoaderGone(true), 350)
    }, remaining)
    return () => clearTimeout(t)
  }, [allSettled])

  return (
    <>
      {/* App always renders behind the loader — no zero-flash when overlay lifts */}
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

      {/* Loader overlay — fades out once data is ready, then unmounts */}
      {!loaderGone && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            opacity: loaderFading ? 0 : 1,
            transition: 'opacity 350ms ease',
            pointerEvents: loaderFading ? 'none' : 'all',
          }}
        >
          <AppLoader />
        </div>
      )}
    </>
  )
}
