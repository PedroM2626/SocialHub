import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import { MobileHeader } from '@/components/MobileHeader'

export default function Layout() {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="lg:pl-64 flex flex-col flex-1">
        <MobileHeader />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
