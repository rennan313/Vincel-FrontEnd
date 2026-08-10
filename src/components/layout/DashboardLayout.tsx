import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/store/authStore'
import { useSidebarStore } from '@/store/sidebarStore'
import { useMediaQuery } from '@/lib/useMediaQuery'

export function DashboardLayout() {
  const user = useAuthStore((state) => state.user)
  const sidebarOpen = useSidebarStore((state) => state.open)
  const closeSidebar = useSidebarStore((state) => state.close)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    if (isDesktop) closeSidebar()
  }, [isDesktop, closeSidebar])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  if (!user) return <Navigate to="/" replace />

  return (
    <div className="flex h-screen overflow-hidden bg-(--th-bg)">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
