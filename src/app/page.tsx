'use client'

import { useAppStore, ViewType } from '@/lib/store'
import { AppLayout } from '@/components/crm/shared/AppLayout'
import { LandingPage } from '@/components/crm/landing/LandingPage'
import { LoginForm } from '@/components/crm/auth/LoginForm'
import { RegisterForm } from '@/components/crm/auth/RegisterForm'
import { DashboardView } from '@/components/crm/dashboard/DashboardView'
import { CalendarView } from '@/components/crm/calendar/CalendarView'
import { ClientsView } from '@/components/crm/clients/ClientsView'
import { ClientDetail } from '@/components/crm/clients/ClientDetail'
import { ServicesView } from '@/components/crm/services/ServicesView'
import { AutomationsView } from '@/components/crm/automations/AutomationsView'
import { SettingsView } from '@/components/crm/settings/SettingsView'

function ViewRouter() {
  const { currentView } = useAppStore()

  switch (currentView) {
    case 'dashboard':
      return <DashboardView />
    case 'calendar':
      return <CalendarView />
    case 'clients':
      return <ClientsView />
    case 'client-detail':
      return <ClientDetail />
    case 'services':
      return <ServicesView />
    case 'automations':
      return <AutomationsView />
    case 'settings':
      return <SettingsView />
    default:
      return <DashboardView />
  }
}

export default function Home() {
  const { currentView, isAuthenticated } = useAppStore()

  // Unauthenticated views
  if (!isAuthenticated) {
    switch (currentView) {
      case 'login':
        return <LoginForm />
      case 'register':
        return <RegisterForm />
      default:
        return <LandingPage />
    }
  }

  // Authenticated views with layout
  return (
    <AppLayout>
      <ViewRouter />
    </AppLayout>
  )
}
