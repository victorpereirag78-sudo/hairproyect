'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Calendar,
  DollarSign,
  Users,
  UserX,
  TrendingUp,
  Clock,
  AlertTriangle,
  Bell,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Ban,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAppStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TodayAppointment {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  client: { firstName: string; lastName: string }
  services: Array<{ service: { name: string; price: number } }>
}

interface ServicePopularity {
  name: string
  count: number
  revenue: number
}

interface SmartAlert {
  type: string
  clientId?: string
  clientName: string
  message: string
}

interface DashboardData {
  todayAppointments: TodayAppointment[]
  todayRevenue: number
  monthRevenue: number
  totalClients: number
  newClients: number
  recurringClients: number
  inactiveClients: number
  newClientsThisMonth: number
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  revenueByDay: Record<string, number>
  appointmentsByDay: Record<string, number>
  servicePopularity: ServicePopularity[]
  smartAlerts: SmartAlert[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCLP = (amount: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount)

const formatNumber = (n: number) =>
  new Intl.NumberFormat('es-CL').format(n)

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'scheduled':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      )
    case 'confirmed':
      return (
        <Badge className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirmada
        </Badge>
      )
    case 'completed':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completada
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelada
        </Badge>
      )
    case 'no_show':
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
          <Ban className="h-3 w-3 mr-1" />
          No asistió
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'inactive_client':
      return <UserX className="h-4 w-4 text-violet-500 shrink-0" />
    case 'reminder_needed':
      return <Bell className="h-4 w-4 text-amber-500 shrink-0" />
    default:
      return <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
  }
}

const getAlertColor = (type: string) => {
  switch (type) {
    case 'inactive_client':
      return 'border-l-violet-400'
    case 'reminder_needed':
      return 'border-l-amber-400'
    default:
      return 'border-l-rose-400'
  }
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[260px] w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Appointments & Alerts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      <p className="text-rose-500 font-semibold">{formatCLP(payload[0].value)}</p>
    </div>
  )
}

function ServiceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-foreground mb-1">{payload[0].payload.name}</p>
      <p className="text-emerald-500 font-semibold">{formatCLP(payload[0].value)}</p>
      <p className="text-muted-foreground text-xs">{formatNumber(payload[0].payload.count)} citas</p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setCurrentView, setSelectedClientId } = useAppStore()

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Error al cargar datos')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // ─── Process chart data ──────────────────────────────────────────────

  const revenueChartData = (() => {
    if (!data) return []
    const entries = Object.entries(data.revenueByDay).sort(([a], [b]) => a.localeCompare(b))
    // Fill in missing days for the last 30 days
    const now = new Date()
    const days: { date: string; revenue: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      const dayLabel = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
      const revenue = entries.find(([k]) => k === key)?.[1] || 0
      days.push({ date: dayLabel, revenue })
    }
    return days
  })()

  const serviceChartData = (() => {
    if (!data) return []
    return data.servicePopularity.slice(0, 8).map((s) => ({
      name: s.name.length > 14 ? s.name.slice(0, 14) + '...' : s.name,
      revenue: s.revenue,
      count: s.count,
      fullName: s.name,
    }))
  })()

  // ─── Client pipeline data ────────────────────────────────────────────

  const clientPipeline = (() => {
    if (!data) return { new: 0, recurring: 0, inactive: 0, total: 0 }
    const total = data.totalClients || 1
    return {
      new: Math.round((data.newClients / total) * 100),
      recurring: Math.round((data.recurringClients / total) * 100),
      inactive: Math.round((data.inactiveClients / total) * 100),
      total,
    }
  })()

  // ─── Handle alert click ──────────────────────────────────────────────

  const handleAlertClick = (alert: SmartAlert) => {
    if (alert.clientId) {
      setSelectedClientId(alert.clientId)
      setCurrentView('client-detail')
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-rose-400" />
        <p className="text-muted-foreground text-center">{error}</p>
        <Button variant="outline" onClick={fetchDashboard} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Resumen de tu peluquería &middot;{' '}
            {new Date().toLocaleDateString('es-CL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboard}
          className="gap-2 w-fit"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* ── Metric Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Citas hoy */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/40 dark:to-rose-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                    Citas hoy
                  </p>
                  <p className="text-3xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                    {formatNumber(data.todayAppointments.length)}
                  </p>
                  <p className="text-xs text-rose-500/70 dark:text-rose-400/60 mt-1">
                    {data.todayAppointments.filter(a => a.status === 'completed').length} completadas
                  </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-rose-900/30">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Ingresos del día */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Ingresos del día
                  </p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                    {formatCLP(data.todayRevenue)}
                  </p>
                  <p className="text-xs text-amber-500/70 dark:text-amber-400/60 mt-1">
                    Mes: {formatCLP(data.monthRevenue)}
                  </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Clientes activos */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Clientes activos
                  </p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                    {formatNumber(data.recurringClients)}
                  </p>
                  <p className="text-xs text-emerald-500/70 dark:text-emerald-400/60 mt-1">
                    +{data.newClientsThisMonth} nuevos este mes
                  </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Clientes inactivos */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/40 dark:to-violet-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                    Clientes inactivos
                  </p>
                  <p className="text-3xl font-bold text-violet-700 dark:text-violet-300 mt-1">
                    {formatNumber(data.inactiveClients)}
                  </p>
                  <p className="text-xs text-violet-500/70 dark:text-violet-400/60 mt-1">
                    Requieren seguimiento
                  </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
                  <UserX className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Ingresos últimos 30 días</CardTitle>
                <CardDescription>Tendencia de ingresos diarios</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-semibold">{formatCLP(data.monthRevenue)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Service popularity chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Servicios más populares</CardTitle>
                <CardDescription>Por ingresos generados</CardDescription>
              </div>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            {serviceChartData.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                No hay datos de servicios aún
              </div>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      width={90}
                    />
                    <Tooltip content={<ServiceTooltip />} />
                    <Bar
                      dataKey="revenue"
                      fill="#10b981"
                      radius={[0, 6, 6, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Appointments & Alerts Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's appointments */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Citas de hoy</CardTitle>
                <CardDescription>
                  {data.todayAppointments.length} cita{data.todayAppointments.length !== 1 ? 's' : ''} programada{data.todayAppointments.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1"
                onClick={() => setCurrentView('calendar')}
              >
                Ver calendario
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.todayAppointments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No hay citas para hoy</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-2 pr-2">
                  {data.todayAppointments.map((apt) => {
                    const servicesTotal = apt.services.reduce(
                      (s, as) => s + as.service.price,
                      0
                    )
                    const serviceNames = apt.services
                      .map((as) => as.service.name)
                      .join(', ')
                    return (
                      <div
                        key={apt.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-center min-w-[52px]">
                          <p className="text-sm font-bold text-foreground">
                            {apt.startTime}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {apt.endTime}
                          </p>
                        </div>
                        <Separator orientation="vertical" className="h-10" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {apt.client.firstName} {apt.client.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {serviceNames}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {getStatusBadge(apt.status)}
                          <span className="text-xs font-medium text-muted-foreground">
                            {formatCLP(servicesTotal)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Smart alerts */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Alertas inteligentes</CardTitle>
                <CardDescription>
                  {data.smartAlerts.length} alerta{data.smartAlerts.length !== 1 ? 's' : ''} activa{data.smartAlerts.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            {data.smartAlerts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Todo en orden, sin alertas</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-2 pr-2">
                  {data.smartAlerts.map((alert, i) => (
                    <button
                      key={i}
                      onClick={() => handleAlertClick(alert)}
                      className={`
                        w-full text-left p-3 rounded-lg border border-l-4 ${getAlertColor(alert.type)}
                        hover:bg-muted/50 transition-colors group
                      `}
                    >
                      <div className="flex items-start gap-2.5">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {alert.clientName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {alert.message}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Client Pipeline Summary ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Pipeline de clientes</CardTitle>
              <CardDescription>
                Distribución de {formatNumber(clientPipeline.total)} clientes totales
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => setCurrentView('clients')}
            >
              Ver clientes
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Horizontal stacked bar */}
          <div className="flex h-8 rounded-full overflow-hidden bg-muted mb-4">
            {data.newClients > 0 && (
              <div
                className="bg-gradient-to-r from-sky-400 to-sky-500 flex items-center justify-center transition-all duration-500"
                style={{ width: `${clientPipeline.new}%` }}
              >
                <span className="text-[10px] font-bold text-white">
                  {clientPipeline.new > 8 ? `${clientPipeline.new}%` : ''}
                </span>
              </div>
            )}
            {data.recurringClients > 0 && (
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center transition-all duration-500"
                style={{ width: `${clientPipeline.recurring}%` }}
              >
                <span className="text-[10px] font-bold text-white">
                  {clientPipeline.recurring > 8 ? `${clientPipeline.recurring}%` : ''}
                </span>
              </div>
            )}
            {data.inactiveClients > 0 && (
              <div
                className="bg-gradient-to-r from-violet-400 to-violet-500 flex items-center justify-center transition-all duration-500"
                style={{ width: `${clientPipeline.inactive}%` }}
              >
                <span className="text-[10px] font-bold text-white">
                  {clientPipeline.inactive > 8 ? `${clientPipeline.inactive}%` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Legend with numbers */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-sky-400 to-sky-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Nuevos</p>
                <p className="text-sm font-bold">{formatNumber(data.newClients)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Recurrentes</p>
                <p className="text-sm font-bold">{formatNumber(data.recurringClients)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-violet-400 to-violet-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Inactivos</p>
                <p className="text-sm font-bold">{formatNumber(data.inactiveClients)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Appointment Stats Summary ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumen de citas</CardTitle>
          <CardDescription>Estadísticas generales de citas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{formatNumber(data.totalAppointments)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatNumber(data.completedAppointments)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Completadas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20">
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {formatNumber(data.cancelledAppointments)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Canceladas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {formatNumber(data.noShowAppointments)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">No asistieron</p>
            </div>
          </div>

          {/* Completion rate bar */}
          {data.totalAppointments > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tasa de completado</span>
                <span className="font-semibold">
                  {Math.round(
                    (data.completedAppointments / data.totalAppointments) * 100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={Math.round(
                  (data.completedAppointments / data.totalAppointments) * 100
                )}
                className="h-2.5"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
