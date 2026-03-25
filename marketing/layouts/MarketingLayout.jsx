import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@marketing/components/Navbar'
import Footer from '@marketing/components/Footer'

export default function MarketingLayout() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
