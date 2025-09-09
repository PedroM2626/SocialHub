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

      {/* Main content area: reserve space for desktop sidebar with lg:pl-64 and
          provide comfortable responsive padding on smaller screens. We also
          add top padding on mobile to avoid content being hidden behind the
          sticky mobile header. */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <MobileHeader />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 lg:pt-0">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
