'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  UserPlus,
  Eye,
  Calendar,
  Phone,
  Mail,
  Users,
  UserCheck,
  UserX,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types
interface ClientItem {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  status: string
  notes: string | null
  source: string | null
  preferences: string | null
  createdAt: string
  updatedAt: string
  appointments: { id: string; date: string; status: string }[]
  clientNotes: { id: string; content: string; type: string; createdAt: string }[]
  totalAppointments: number
  completedAppointments: number
  daysSinceLastVisit: number | null
}

type StatusFilter = 'all' | 'new' | 'recurring' | 'inactive'

const pipelineConfig = {
  new: { label: 'Nuevos', color: 'amber', icon: Users },
  recurring: { label: 'Recurrentes', color: 'emerald', icon: UserCheck },
  inactive: { label: 'Inactivos', color: 'rose', icon: UserX },
} as const

function getStatusBadge(status: string) {
  switch (status) {
    case 'new':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Nuevo</Badge>
    case 'recurring':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Recurrente</Badge>
    case 'inactive':
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Inactivo</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatChileanDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDaysSince(days: number | null) {
  if (days === null) return '—'
  if (days === 0) return 'Hoy'
  if (days === 1) return '1 día'
  return `${days} días`
}

export function ClientsView() {
  const { setCurrentView, setSelectedClientId } = useAppStore()

  // State
  const [clients, setClients] = useState<ClientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'lastVisit' | 'visits'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // New client form
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
  })
  const [creating, setCreating] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch clients
  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/clients?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, debouncedSearch])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // Counts by status
  const counts = {
    new: clients.filter((c) => c.status === 'new').length,
    recurring: clients.filter((c) => c.status === 'recurring').length,
    inactive: clients.filter((c) => c.status === 'inactive').length,
    total: clients.length,
  }

  // All counts (not filtered)
  const [allCounts, setAllCounts] = useState({ new: 0, recurring: 0, inactive: 0, total: 0 })

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/clients')
        if (res.ok) {
          const data = await res.json()
          setAllCounts({
            new: data.filter((c: ClientItem) => c.status === 'new').length,
            recurring: data.filter((c: ClientItem) => c.status === 'recurring').length,
            inactive: data.filter((c: ClientItem) => c.status === 'inactive').length,
            total: data.length,
          })
        }
      } catch {
        // silent
      }
    }
    fetchCounts()
  }, [debouncedSearch])

  // Sort clients
  const sortedClients = [...clients].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortBy) {
      case 'name':
        return dir * `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      case 'lastVisit':
        return dir * ((a.daysSinceLastVisit ?? 9999) - (b.daysSinceLastVisit ?? 9999))
      case 'visits':
        return dir * (a.completedAppointments - b.completedAppointments)
      default:
        return 0
    }
  })

  // Create client
  const handleCreateClient = async () => {
    if (!newClient.firstName.trim() || !newClient.lastName.trim()) {
      toast.error('Nombre y apellido son requeridos')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      })
      if (res.ok) {
        toast.success('Cliente creado exitosamente')
        setShowNewClientDialog(false)
        setNewClient({ firstName: '', lastName: '', email: '', phone: '', source: '', notes: '' })
        fetchClients()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear cliente')
      }
    } catch {
      toast.error('Error al crear cliente')
    } finally {
      setCreating(false)
    }
  }

  // Navigate to client detail
  const goToDetail = (clientId: string) => {
    setSelectedClientId(clientId)
    setCurrentView('client-detail')
  }

  // Toggle sort
  const toggleSort = (field: 'name' | 'lastVisit' | 'visits') => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  // Pipeline card component
  const PipelineCard = ({
    status,
    config,
  }: {
    status: StatusFilter
    config: (typeof pipelineConfig)[keyof typeof pipelineConfig]
  }) => {
    const isActive = statusFilter === status
    const Icon = config.icon
    const count = allCounts[status as keyof typeof allCounts] || 0

    const colorClasses: Record<string, { bg: string; border: string; icon: string; activeBg: string }> = {
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        icon: 'text-amber-600 dark:text-amber-400',
        activeBg: 'bg-amber-100 dark:bg-amber-900/50 ring-2 ring-amber-400',
      },
      emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: 'text-emerald-600 dark:text-emerald-400',
        activeBg: 'bg-emerald-100 dark:bg-emerald-900/50 ring-2 ring-emerald-400',
      },
      rose: {
        bg: 'bg-rose-50 dark:bg-rose-950/30',
        border: 'border-rose-200 dark:border-rose-800',
        icon: 'text-rose-600 dark:text-rose-400',
        activeBg: 'bg-rose-100 dark:bg-rose-900/50 ring-2 ring-rose-400',
      },
    }

    const colors = colorClasses[config.color]

    return (
      <button
        onClick={() => setStatusFilter(isActive ? 'all' : status)}
        className={`
          flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer w-full text-left
          ${isActive ? colors.activeBg + ' ' + colors.border : colors.bg + ' ' + colors.border}
          hover:shadow-sm
        `}
      >
        <div className={`p-2 rounded-lg ${colors.bg} ${colors.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{config.label}</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
      </button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground text-sm">
            Gestiona tu base de clientes y su historial
          </p>
        </div>
        <Button
          onClick={() => setShowNewClientDialog(true)}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Pipeline Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`
            flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer text-left
            ${statusFilter === 'all'
              ? 'bg-primary/10 ring-2 ring-primary border-primary/30'
              : 'bg-card border-border hover:shadow-sm'
            }
          `}
        >
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Todos</p>
            <p className="text-2xl font-bold">{allCounts.total}</p>
          </div>
        </button>

        {(Object.entries(pipelineConfig) as [StatusFilter, typeof pipelineConfig[keyof typeof pipelineConfig]][]).map(
          ([status, config]) => (
            <PipelineCard key={status} status={status} config={config} />
          )
        )}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {(statusFilter !== 'all' || debouncedSearch) && (
          <Button
            variant="outline"
            onClick={() => {
              setStatusFilter('all')
              setSearchTerm('')
            }}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Client List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : sortedClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No se encontraron clientes</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {debouncedSearch
                ? 'Intenta con otro término de búsqueda'
                : 'Agrega tu primer cliente para comenzar'}
            </p>
            {!debouncedSearch && (
              <Button onClick={() => setShowNewClientDialog(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Nuevo Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => toggleSort('name')}
                    >
                      Cliente
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => toggleSort('lastVisit')}
                    >
                      Última visita
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => toggleSort('visits')}
                    >
                      Visitas
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Días sin visita</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => goToDetail(client.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {client.firstName[0]}
                          {client.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client.source
                              ? client.source === 'walk-in'
                                ? 'Espontáneo'
                                : client.source === 'referral'
                                ? 'Referido'
                                : client.source === 'social'
                                ? 'Redes sociales'
                                : 'Otro'
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {client.phone && (
                          <p className="text-sm flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {client.phone}
                          </p>
                        )}
                        {client.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </p>
                        )}
                        {!client.phone && !client.email && (
                          <p className="text-xs text-muted-foreground">Sin contacto</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell className="text-sm">
                      {client.appointments?.length > 0
                        ? formatChileanDate(client.appointments[0].date)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{client.completedAppointments}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm ${
                          client.daysSinceLastVisit && client.daysSinceLastVisit > 30
                            ? 'text-rose-600 font-medium'
                            : client.daysSinceLastVisit && client.daysSinceLastVisit > 14
                            ? 'text-amber-600'
                            : ''
                        }`}
                      >
                        {formatDaysSince(client.daysSinceLastVisit)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => goToDetail(client.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentView('calendar')
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Agendar cita
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y">
            {sortedClients.map((client) => (
              <div
                key={client.id}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => goToDetail(client.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {client.firstName[0]}
                      {client.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {client.firstName} {client.lastName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getStatusBadge(client.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        goToDetail(client.id)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground ml-13">
                  {client.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDaysSince(client.daysSinceLastVisit)}
                  </span>
                  <span>{client.completedAppointments} visitas</span>
                </div>
              </div>
            ))}
          </div>

          {/* Results count */}
          <div className="px-4 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
            Mostrando {sortedClients.length} cliente{sortedClients.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' && ` · Filtrado: ${pipelineConfig[statusFilter as keyof typeof pipelineConfig]?.label || statusFilter}`}
            {debouncedSearch && ` · Búsqueda: "${debouncedSearch}"`}
          </div>
        </div>
      )}

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Nuevo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Nombre <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="Valentina"
                  value={newClient.firstName}
                  onChange={(e) =>
                    setNewClient((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Apellido <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Rojas"
                  value={newClient.lastName}
                  onChange={(e) =>
                    setNewClient((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="valentina@email.cl"
                value={newClient.email}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+56 9 1234 5678"
                value={newClient.phone}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">¿Cómo nos conoció?</Label>
              <Select
                value={newClient.source}
                onValueChange={(value) =>
                  setNewClient((prev) => ({ ...prev, source: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Espontáneo (Walk-in)</SelectItem>
                  <SelectItem value="referral">Referido</SelectItem>
                  <SelectItem value="social">Redes sociales</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas sobre el cliente..."
                value={newClient.notes}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewClientDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateClient} disabled={creating}>
              {creating ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
