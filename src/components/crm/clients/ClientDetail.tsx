'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  Edit2,
  Plus,
  AlertTriangle,
  CheckCircle,
  Info,
  StickyNote,
  User,
  TrendingUp,
  Sparkles,
  MessageSquare,
  ChevronRight,
  Save,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types
interface AppointmentService {
  id: string
  service: {
    id: string
    name: string
    price: number
    duration: number
  }
}

interface AppointmentItem {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  staff: { id: string; name: string } | null
  services: AppointmentService[]
}

interface ClientNoteItem {
  id: string
  content: string
  type: string
  createdAt: string
}

interface ClientDetailData {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  status: string
  notes: string | null
  source: string | null
  preferences: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  appointments: AppointmentItem[]
  clientNotes: ClientNoteItem[]
  totalAppointments: number
  completedAppointments: number
  totalSpent: number
  daysSinceLastVisit: number | null
}

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

function getAppointmentStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Completada</Badge>
    case 'confirmed':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Confirmada</Badge>
    case 'scheduled':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Agendada</Badge>
    case 'cancelled':
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Cancelada</Badge>
    case 'no_show':
      return <Badge className="bg-rose-100 text-rose-700 border-rose-200">No asistió</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getNoteTypeBadge(type: string) {
  switch (type) {
    case 'preference':
      return <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">Preferencia</Badge>
    case 'alert':
      return <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-xs">Alerta</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">General</Badge>
  }
}

function formatChileanDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatChileanShortDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount)
}

function getSmartRecommendation(client: ClientDetailData | null) {
  if (!client) return null

  const recommendations: { icon: React.ReactNode; text: string; type: string }[] = []

  // Inactive client check
  if (client.status === 'inactive' || (client.daysSinceLastVisit && client.daysSinceLastVisit > 30)) {
    recommendations.push({
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      text: `Cliente sin visita hace ${client.daysSinceLastVisit} días. Considera enviar un mensaje de reactivación con descuento.`,
      type: 'warning',
    })
  }

  // Loyalty check
  if (client.completedAppointments > 0 && client.completedAppointments % 5 === 0) {
    recommendations.push({
      icon: <Sparkles className="h-4 w-4 text-violet-500" />,
      text: `¡El cliente ha completado ${client.completedAppointments} visitas! Ofrecer beneficio de fidelización.`,
      type: 'success',
    })
  }

  // Recurring pattern
  if (client.completedAppointments >= 3 && client.status === 'new') {
    recommendations.push({
      icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
      text: 'Cliente con 3+ visitas completadas. Considera cambiar su estado a Recurrente.',
      type: 'info',
    })
  }

  // Alert notes
  const alertNotes = client.clientNotes.filter((n) => n.type === 'alert')
  if (alertNotes.length > 0) {
    recommendations.push({
      icon: <AlertTriangle className="h-4 w-4 text-rose-500" />,
      text: `Tiene ${alertNotes.length} nota${alertNotes.length > 1 ? 's' : ''} de alerta. Revisar antes de atender.`,
      type: 'warning',
    })
  }

  return recommendations
}

export function ClientDetail() {
  const { selectedClientId, setCurrentView, setSelectedClientId } = useAppStore()
  const [client, setClient] = useState<ClientDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: '',
    source: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  // Note form
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState('general')
  const [addingNote, setAddingNote] = useState(false)

  // Fetch client detail
  const fetchClient = useCallback(async () => {
    if (!selectedClientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${selectedClientId}`)
      if (res.ok) {
        const data = await res.json()
        setClient(data)
        setEditForm({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || '',
          phone: data.phone || '',
          status: data.status,
          source: data.source || '',
          notes: data.notes || '',
        })
      } else {
        toast.error('Cliente no encontrado')
        setCurrentView('clients')
        setSelectedClientId(null)
      }
    } catch {
      toast.error('Error al cargar cliente')
    } finally {
      setLoading(false)
    }
  }, [selectedClientId, setCurrentView, setSelectedClientId])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  // Update client
  const handleUpdateClient = async () => {
    if (!selectedClientId) return
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      toast.error('Nombre y apellido son requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${selectedClientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        toast.success('Cliente actualizado')
        setShowEditDialog(false)
        fetchClient()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar')
      }
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  // Add note
  const handleAddNote = async () => {
    if (!selectedClientId || !noteContent.trim()) {
      toast.error('El contenido de la nota es requerido')
      return
    }
    setAddingNote(true)
    try {
      const res = await fetch('/api/client-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          content: noteContent,
          type: noteType,
        }),
      })
      if (res.ok) {
        toast.success('Nota agregada')
        setNoteContent('')
        setNoteType('general')
        fetchClient()
      } else {
        toast.error('Error al agregar nota')
      }
    } catch {
      toast.error('Error al agregar nota')
    } finally {
      setAddingNote(false)
    }
  }

  // Calculate avg time between visits
  const getAvgTimeBetweenVisits = () => {
    if (!client) return '—'
    const completed = client.appointments
      .filter((a) => a.status === 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (completed.length < 2) return 'Insuficientes datos'

    const diffs: number[] = []
    for (let i = 1; i < completed.length; i++) {
      const diff = new Date(completed[i].date).getTime() - new Date(completed[i - 1].date).getTime()
      diffs.push(diff / (1000 * 60 * 60 * 24))
    }

    const avg = diffs.reduce((sum, d) => sum + d, 0) / diffs.length
    return `${Math.round(avg)} días`
  }

  const recommendations = getSmartRecommendation(client)

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!client) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedClientId(null)
              setCurrentView('clients')
            }}
            className="mt-0.5 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight">
                {client.firstName} {client.lastName}
              </h2>
              {getStatusBadge(client.status)}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              {client.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {client.phone}
                </span>
              )}
              {client.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {client.email}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Cliente desde {formatChileanDate(client.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" className="gap-2" onClick={() => setShowEditDialog(true)}>
            <Edit2 className="h-4 w-4" />
            Editar
          </Button>
          <Button
            className="gap-2"
            onClick={() => setCurrentView('calendar')}
          >
            <Calendar className="h-4 w-4" />
            Agendar Cita
          </Button>
        </div>
      </div>

      {/* Smart Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-2">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                rec.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                  : rec.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
              }`}
            >
              <div className="mt-0.5 shrink-0">{rec.icon}</div>
              <p className="flex-1">{rec.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Total Visitas</span>
            </div>
            <p className="text-2xl font-bold">{client.completedAppointments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Total Gastado</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(client.totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Última Visita</span>
            </div>
            <p className="text-lg font-bold">
              {client.daysSinceLastVisit !== null
                ? client.daysSinceLastVisit === 0
                  ? 'Hoy'
                  : client.daysSinceLastVisit === 1
                  ? 'Ayer'
                  : `Hace ${client.daysSinceLastVisit} días`
                : 'Sin visitas'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Frecuencia</span>
            </div>
            <p className="text-lg font-bold">{getAvgTimeBetweenVisits()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="history" className="gap-1.5">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">Notas</span>
            {client.clientNotes.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5">
                {client.clientNotes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-1.5">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historial de Citas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {client.appointments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Sin citas registradas</p>
                  <p className="text-sm mt-1">Agenda la primera cita para este cliente</p>
                </div>
              ) : (
                <div className="divide-y max-h-96 overflow-y-auto custom-scrollbar">
                  {client.appointments.map((apt) => {
                    const totalAmount = apt.services.reduce(
                      (sum, s) => sum + s.service.price,
                      0
                    )
                    const totalDuration = apt.services.reduce(
                      (sum, s) => sum + s.service.duration,
                      0
                    )
                    return (
                      <div key={apt.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">
                                {formatChileanDate(apt.date)}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {apt.startTime} - {apt.endTime}
                              </span>
                              {getAppointmentStatusBadge(apt.status)}
                            </div>
                            <div className="mt-1.5 space-y-0.5">
                              {apt.services.map((s) => (
                                <p key={s.id} className="text-sm text-muted-foreground flex items-center gap-1.5">
                                  <ChevronRight className="h-3 w-3 opacity-50" />
                                  {s.service.name} · {s.service.duration} min · {formatCurrency(s.service.price)}
                                </p>
                              ))}
                            </div>
                            {apt.staff && (
                              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Estilista: {apt.staff.name}
                              </p>
                            )}
                            {apt.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                {apt.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-sm">{formatCurrency(totalAmount)}</p>
                            <p className="text-xs text-muted-foreground">{totalDuration} min</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          {/* Add note form */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Agregar Nota</p>
              </div>
              <Textarea
                placeholder="Escribe una nota sobre el cliente..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={2}
              />
              <div className="flex items-center justify-between gap-3">
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="preference">Preferencia</SelectItem>
                    <SelectItem value="alert">Alerta</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={addingNote || !noteContent.trim()}
                  className="gap-1.5"
                >
                  {addingNote ? 'Guardando...' : 'Guardar Nota'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes list */}
          {client.clientNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <StickyNote className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Sin notas</p>
                <p className="text-sm mt-1">Agrega notas para recordar preferencias y detalles</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {client.clientNotes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {getNoteTypeBadge(note.type)}
                          <span className="text-xs text-muted-foreground">
                            {formatChileanShortDate(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                      {note.type === 'alert' && (
                        <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      {note.type === 'preference' && (
                        <CheckCircle className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nombre completo</span>
                    <span className="text-sm font-medium">
                      {client.firstName} {client.lastName}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{client.email || '—'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Teléfono</span>
                    <span className="text-sm font-medium">{client.phone || '—'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estado</span>
                    {getStatusBadge(client.status)}
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Fuente</span>
                    <span className="text-sm font-medium">
                      {client.source
                        ? client.source === 'walk-in'
                          ? 'Espontáneo'
                          : client.source === 'referral'
                          ? 'Referido'
                          : client.source === 'social'
                          ? 'Redes sociales'
                          : 'Otro'
                        : '—'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cliente desde</span>
                    <span className="text-sm font-medium">{formatChileanDate(client.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total visitas</span>
                    <span className="text-sm font-bold">{client.completedAppointments}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Citas agendadas</span>
                    <span className="text-sm font-medium">{client.appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total gastado</span>
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(client.totalSpent)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Promedio por visita</span>
                    <span className="text-sm font-medium">
                      {client.completedAppointments > 0
                        ? formatCurrency(client.totalSpent / client.completedAppointments)
                        : '—'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Frecuencia promedio</span>
                    <span className="text-sm font-medium">{getAvgTimeBetweenVisits()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Días sin visita</span>
                    <span className={`text-sm font-medium ${
                      client.daysSinceLastVisit && client.daysSinceLastVisit > 30
                        ? 'text-rose-600'
                        : client.daysSinceLastVisit && client.daysSinceLastVisit > 14
                        ? 'text-amber-600'
                        : ''
                    }`}>
                      {client.daysSinceLastVisit !== null
                        ? client.daysSinceLastVisit === 0
                          ? 'Hoy'
                          : `${client.daysSinceLastVisit} días`
                        : '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            {client.preferences && Object.keys(client.preferences).length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Preferencias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(client.preferences).map(([key, value]) => (
                      <div
                        key={key}
                        className="p-3 rounded-lg bg-muted/50 border"
                      >
                        <p className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm font-medium mt-0.5">
                          {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {client.notes && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Notas Generales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Client Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Editar Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">
                  Nombre <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="edit-firstName"
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">
                  Apellido <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="edit-lastName"
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Nuevo</SelectItem>
                    <SelectItem value="recurring">Recurrente</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuente</Label>
                <Select
                  value={editForm.source}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, source: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Espontáneo</SelectItem>
                    <SelectItem value="referral">Referido</SelectItem>
                    <SelectItem value="social">Redes sociales</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="h-4 w-4 mr-1.5" />
              Cancelar
            </Button>
            <Button onClick={handleUpdateClient} disabled={saving}>
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
