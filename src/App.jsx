import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { ThemeProvider } from '@/lib/ThemeContext'

// App
import PageNotFound from './lib/PageNotFound'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import SetupProfile from '@/pages/SetupProfile'
import BillingSuccess from '@/pages/BillingSuccess'
import Dashboard from '@/pages/Dashboard'
import Vehicles from '@/pages/Vehicles'
import VehicleDetail from '@/pages/VehicleDetail'
import Drivers from '@/pages/Drivers'
import DriverDetail from '@/pages/DriverDetail'
import Assignments from '@/pages/Assignments'
import Mileage from '@/pages/Mileage'
import Maintenance from '@/pages/Maintenance'
import Inspections from '@/pages/Inspections'
import Washings from '@/pages/Washings'
import Settings from '@/pages/Settings'
import ActivityLog from '@/pages/ActivityLog'

const MARKETING_URL = 'https://fleetdesk.fr'

function ExternalRedirect({ to }) {
  useEffect(() => { window.location.replace(to) }, [to])
  return null
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return null

  // Not signed in — only login is accessible, everything else → marketing site
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/billing/success" element={<BillingSuccess />} />
        <Route path="*" element={<ExternalRedirect to={MARKETING_URL} />} />
      </Routes>
    )
  }

  // Signed in but onboarding not complete
  if (!user.user_metadata?.onboarding_complete) {
    return (
      <Routes>
        <Route path="/setup-profile" element={<SetupProfile />} />
        <Route path="/billing/success" element={<BillingSuccess />} />
        <Route path="*" element={<Navigate to="/setup-profile" replace />} />
      </Routes>
    )
  }

  // Fully authenticated
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/Dashboard" replace />} />
      <Route path="/setup-profile" element={<Navigate to="/Dashboard" replace />} />
      <Route path="/billing/success" element={<BillingSuccess />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/Dashboard" replace />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Vehicles" element={<Vehicles />} />
        <Route path="/Vehicles/:id" element={<VehicleDetail />} />
        <Route path="/Drivers" element={<Drivers />} />
        <Route path="/Drivers/:id" element={<DriverDetail />} />
        <Route path="/Assignments" element={<Assignments />} />
        <Route path="/Mileage" element={<Mileage />} />
        <Route path="/Maintenance" element={<Maintenance />} />
        <Route path="/Inspections" element={<Inspections />} />
        <Route path="/Washings" element={<Washings />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="/Activity" element={<ActivityLog />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AppRoutes />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
