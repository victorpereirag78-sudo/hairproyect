'use client'

import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Zap,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useAppStore, ViewType } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useEffect, useState, useCallback } from 'react'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

const navItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { view: 'calendar', label: 'Calendario', icon: <Calendar className="h-5 w-5" /> },
  { view: 'clients', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
  { view: 'services', label: 'Servicios', icon: <Scissors className="h-5 w-5" /> },
  { view: 'automations', label: 'Automatizaciones', icon: <Zap className="h-5 w-5" /> },
  { view: 'settings', label: 'Configuración', icon: <Settings className="h-5 w-5" /> },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    currentView,
    setCurrentView,
    user,
    logout,
    sidebarOpen,
    setSidebarOpen,
    selectedClientId,
    setSelectedClientId,
  } = useAppStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: NotificationItem) => !n.read).length)
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    }
  }, [])

  useEffect(() => {
    if (user) {
      const timeout = setTimeout(() => {
        fetchNotifications()
      }, 0)
      const interval = setInterval(fetchNotifications, 30000)
      return () => {
        clearTimeout(timeout)
        clearInterval(interval)
      }
    }
  }, [user, fetchNotifications])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error(e)
    }
    logout()
    setCurrentView('landing')
  }

  const handleNavClick = (view: ViewType) => {
    if (view === 'clients' && currentView === 'client-detail') {
      setSelectedClientId(null)
    }
    setCurrentView(view)
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PUT' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (e) {
      console.error(e)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-500'
      case 'warning': return 'bg-amber-500'
      case 'alert': return 'bg-rose-500'
      default: return 'bg-primary'
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center">
                <Scissors className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold gradient-text">Glossy CRM</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">{user?.salonName || 'Tu peluquería'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Notificaciones</h4>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                      Marcar todo leído
                    </Button>
                  )}
                </div>
                <ScrollArea className="max-h-80">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">Sin notificaciones</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getTypeColor(n.type)}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* User */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white text-xs font-bold">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium">{user?.name}</span>
            </div>

            <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-60 bg-card border-r pt-14 transition-transform lg:translate-x-0 lg:static lg:pt-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <ScrollArea className="h-full">
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${currentView === item.view || (item.view === 'clients' && currentView === 'client-detail')
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                  {item.view === 'clients' && (
                    <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                  )}
                </button>
              ))}
            </nav>

            <Separator className="mx-3" />

            {/* Quick stats in sidebar */}
            <div className="p-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3">Accesos rápidos</p>
              <button
                onClick={() => setCurrentView('calendar')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <p className="text-xs font-medium">Nueva cita</p>
                <p className="text-[10px] text-muted-foreground">Agendar rápidamente</p>
              </button>
              <button
                onClick={() => setCurrentView('clients')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <p className="text-xs font-medium">Nuevo cliente</p>
                <p className="text-[10px] text-muted-foreground">Registrar cliente</p>
              </button>
            </div>
          </ScrollArea>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="view-transition p-4 md:p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
