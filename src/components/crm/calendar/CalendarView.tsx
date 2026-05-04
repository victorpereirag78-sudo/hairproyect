'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, parse, addMinutes, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Plus,
  Clock,
  User,
  Scissors,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Trash2,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────
interface ServiceItem {
  id: string
  name: string
  duration: number
  price: number
  category: string | null
  active: boolean
}

interface ClientItem {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
}

interface StaffItem {
  id: string
  name: string
}

interface AppointmentItem {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  clientId: string
  staffId: string | null
  client: { id: string; firstName: string; lastName: string; phone: string | null }
  services: { id: string; service: ServiceItem }[]
  staff: StaffItem | null
}

type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

// ─── Status Config ────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  scheduled: {
    label: 'Programada',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-300',
    dotClass: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmada',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-300',
    dotClass: 'bg-blue-500',
  },
  completed: {
    label: 'Completada',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelada',
    bgClass: 'bg-gray-100 dark:bg-gray-800/30',
    textClass: 'text-gray-500 dark:text-gray-400',
    dotClass: 'bg-gray-400',
  },
  no_show: {
    label: 'No asistió',
    bgClass: 'bg-rose-100 dark:bg-rose-900/30',
    textClass: 'text-rose-700 dark:text-rose-300',
    dotClass: 'bg-rose-500',
  },
}

// ─── Time Helpers ─────────────────────────────────────────────────
const OPEN_TIME = 9
const CLOSE_TIME = 19

function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = OPEN_TIME; h < CLOSE_TIME; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  return `${hour}:${m}`
}

// ─── Main Component ───────────────────────────────────────────────
export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [allMonthAppointments, setAllMonthAppointments] = useState<AppointmentItem[]>([])
  const [clients, setClients] = useState<ClientItem[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formClientId, setFormClientId] = useState('')
  const [formServiceIds, setFormServiceIds] = useState<string[]>([])
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState<AppointmentStatus>('scheduled')
  const [formStaffId, setFormStaffId] = useState<string>('none')

  // Client combobox open state
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false)

  // Appointment dates with dots
  const appointmentDates = useMemo(() => {
    const dates = new Set<string>()
    allMonthAppointments.forEach((apt) => {
      const d = new Date(apt.date)
      dates.add(format(d, 'yyyy-MM-dd'))
    })
    return dates
  }, [allMonthAppointments])

  // Fetch day appointments
  const fetchDayAppointments = useCallback(async (date: Date) => {
    setIsLoading(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const res = await fetch(`/api/appointments?date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(data)
      }
    } catch (e) {
      console.error('Failed to fetch appointments', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch month appointments for dot indicators
  const fetchMonthAppointments = useCallback(async (date: Date) => {
    try {
      const monthStart = format(startOfMonth(date), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(date), 'yyyy-MM-dd')

      // We fetch the whole month by requesting each day or using a broader approach
      // Since the API supports date filtering, we'll fetch month start and look for all
      const res = await fetch(`/api/appointments?date=${monthStart}`)
      if (res.ok) {
        const startData = await res.json()
        // The API filters by a single date, so let's fetch the entire month
        // by getting all appointments and filtering client-side
        const allRes = await fetch('/api/appointments')
        if (allRes.ok) {
          const allData = await allRes.json()
          const monthDays = eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) })
          const monthApts = allData.filter((apt: AppointmentItem) => {
            const aptDate = new Date(apt.date)
            return monthDays.some((d) => isSameDay(d, aptDate))
          })
          setAllMonthAppointments(monthApts)
        }
      }
    } catch (e) {
      console.error('Failed to fetch month appointments', e)
    }
  }, [])

  // Fetch clients and services
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [clientsRes, servicesRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/services'),
        ])
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json()
          setClients(clientsData)
        }
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(servicesData.filter((s: ServiceItem) => s.active))
        }
      } catch (e) {
        console.error('Failed to fetch dropdown data', e)
      }
    }
    fetchDropdownData()
  }, [])

  // Load appointments when date changes
  useEffect(() => {
    fetchDayAppointments(selectedDate)
    fetchMonthAppointments(selectedDate)
  }, [selectedDate, fetchDayAppointments, fetchMonthAppointments])

  // Calculate end time from services
  const calculatedEndTime = useMemo(() => {
    if (!formStartTime || formServiceIds.length === 0) return ''
    const totalDuration = formServiceIds.reduce((sum, sid) => {
      const svc = services.find((s) => s.id === sid)
      return sum + (svc?.duration || 0)
    }, 0)
    if (totalDuration === 0) return ''
    try {
      const start = parse(formStartTime, 'HH:mm', new Date())
      const end = addMinutes(start, totalDuration)
      return format(end, 'HH:mm')
    } catch {
      return ''
    }
  }, [formStartTime, formServiceIds, services])

  // Total price
  const totalPrice = useMemo(() => {
    return formServiceIds.reduce((sum, sid) => {
      const svc = services.find((s) => s.id === sid)
      return sum + (svc?.price || 0)
    }, 0)
  }, [formServiceIds, services])

  // Reset form
  const resetForm = useCallback(() => {
    setFormClientId('')
    setFormServiceIds([])
    setFormStartTime('09:00')
    setFormNotes('')
    setFormStatus('scheduled')
    setFormStaffId('none')
  }, [])

  // Open new appointment dialog
  const handleNewAppointment = useCallback(() => {
    resetForm()
    setShowNewDialog(true)
  }, [resetForm])

  // Open edit appointment dialog
  const handleEditAppointment = useCallback((apt: AppointmentItem) => {
    setEditingAppointment(apt)
    setFormClientId(apt.clientId)
    setFormServiceIds(apt.services.map((s) => s.serviceId))
    setFormStartTime(apt.startTime)
    setFormNotes(apt.notes || '')
    setFormStatus(apt.status as AppointmentStatus)
    setFormStaffId(apt.staffId || 'none')
    setShowEditDialog(true)
  }, [])

  // Create appointment
  const handleCreate = async () => {
    if (!formClientId) {
      toast.error('Selecciona un cliente')
      return
    }
    if (formServiceIds.length === 0) {
      toast.error('Selecciona al menos un servicio')
      return
    }
    if (!formStartTime) {
      toast.error('Selecciona hora de inicio')
      return
    }
    if (!calculatedEndTime) {
      toast.error('No se pudo calcular la hora de fin')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: formStartTime,
          endTime: calculatedEndTime,
          clientId: formClientId,
          serviceIds: formServiceIds,
          staffId: formStaffId === 'none' ? null : formStaffId,
          notes: formNotes || null,
          status: formStatus,
        }),
      })

      if (res.ok) {
        toast.success('Cita creada exitosamente')
        setShowNewDialog(false)
        resetForm()
        fetchDayAppointments(selectedDate)
        fetchMonthAppointments(selectedDate)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear cita')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update appointment
  const handleUpdate = async () => {
    if (!editingAppointment) return
    if (!formClientId) {
      toast.error('Selecciona un cliente')
      return
    }
    if (formServiceIds.length === 0) {
      toast.error('Selecciona al menos un servicio')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: formStartTime,
          endTime: calculatedEndTime || editingAppointment.endTime,
          status: formStatus,
          notes: formNotes || null,
          staffId: formStaffId === 'none' ? null : formStaffId,
          serviceIds: formServiceIds,
        }),
      })

      if (res.ok) {
        toast.success('Cita actualizada')
        setShowEditDialog(false)
        setEditingAppointment(null)
        resetForm()
        fetchDayAppointments(selectedDate)
        fetchMonthAppointments(selectedDate)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete appointment
  const handleDelete = async () => {
    if (!editingAppointment) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/appointments/${editingAppointment.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Cita eliminada')
        setShowEditDialog(false)
        setEditingAppointment(null)
        resetForm()
        fetchDayAppointments(selectedDate)
        fetchMonthAppointments(selectedDate)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setFormServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  // Get appointments for a specific time slot
  const getAppointmentsForTimeSlot = (timeSlot: string): AppointmentItem[] => {
    return appointments.filter((apt) => {
      const aptStartHour = parseInt(apt.startTime.split(':')[0])
      const aptStartMin = parseInt(apt.startTime.split(':')[1])
      const slotHour = parseInt(timeSlot.split(':')[0])
      const slotMin = parseInt(timeSlot.split(':')[1])

      const aptStartTotal = aptStartHour * 60 + aptStartMin
      const slotTotal = slotHour * 60 + slotMin

      const aptEndHour = parseInt(apt.endTime.split(':')[0])
      const aptEndMin = parseInt(apt.endTime.split(':')[1])
      const aptEndTotal = aptEndHour * 60 + aptEndMin

      return slotTotal >= aptStartTotal && slotTotal < aptEndTotal
    })
  }

  // Check if time slot is the start of an appointment
  const isAppointmentStart = (timeSlot: string, apt: AppointmentItem): boolean => {
    return apt.startTime === timeSlot
  }

  // Calculate appointment span (in 30-min slots)
  const getAppointmentSpan = (apt: AppointmentItem): number => {
    const startParts = apt.startTime.split(':').map(Number)
    const endParts = apt.endTime.split(':').map(Number)
    const startMins = startParts[0] * 60 + startParts[1]
    const endMins = endParts[0] * 60 + endParts[1]
    return Math.max(1, Math.ceil((endMins - startMins) / 30))
  }

  const selectedDateFormatted = format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Calendario</h2>
          <p className="text-sm text-muted-foreground capitalize">{selectedDateFormatted}</p>
        </div>
        <Button onClick={handleNewAppointment} className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-md">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Main Content: Calendar + Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Left Panel - Calendar */}
        <Card className="h-fit">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={es}
              className="rounded-md w-full"
              modifiers={{
                hasAppointments: (date) => {
                  return appointmentDates.has(format(date, 'yyyy-MM-dd'))
                },
              }}
              modifiersClassNames={{
                hasAppointments: 'has-appointment',
              }}
              components={{
                DayButton: (props) => {
                  const hasAppt = appointmentDates.has(format(props.day.date, 'yyyy-MM-dd'))
                  return (
                    <CalendarDayButton {...props}>
                      {props.children}
                      {hasAppt && (
                        <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-rose-500" />
                      )}
                    </CalendarDayButton>
                  )
                },
              }}
            />

            <Separator className="my-4" />

            {/* Legend */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leyenda</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className={cn('h-2.5 w-2.5 rounded-full', cfg.dotClass)} />
                    <span className="text-xs text-muted-foreground">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Day summary */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumen del día</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-amber-600">{appointments.filter(a => a.status === 'scheduled').length}</p>
                  <p className="text-[10px] text-amber-600/70">Programadas</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{appointments.filter(a => a.status === 'confirmed').length}</p>
                  <p className="text-[10px] text-blue-600/70">Confirmadas</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-emerald-600">{appointments.filter(a => a.status === 'completed').length}</p>
                  <p className="text-[10px] text-emerald-600/70">Completadas</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-gray-500">{appointments.length}</p>
                  <p className="text-[10px] text-gray-500/70">Total</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Day Schedule */}
        <Card>
          <CardContent className="p-0">
            <div className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm capitalize">{selectedDateFormatted}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const prev = new Date(selectedDate)
                    prev.setDate(prev.getDate() - 1)
                    setSelectedDate(prev)
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const next = new Date(selectedDate)
                    next.setDate(next.getDate() + 1)
                    setSelectedDate(next)
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="animate-pulse space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : appointments.length === 0 ? (
                <div className="p-8 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">Sin citas para este día</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Haz clic en &ldquo;Nueva Cita&rdquo; para agendar</p>
                  <Button
                    onClick={handleNewAppointment}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agendar cita
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  {/* Time grid */}
                  <div className="divide-y">
                    {TIME_SLOTS.map((timeSlot) => {
                      const slotAppointments = getAppointmentsForTimeSlot(timeSlot)
                      const hasApptStart = slotAppointments.some((apt) => isAppointmentStart(timeSlot, apt))

                      return (
                        <div
                          key={timeSlot}
                          className="flex min-h-[48px] group hover:bg-muted/30 transition-colors"
                        >
                          {/* Time label */}
                          <div className="w-20 shrink-0 flex items-start justify-end pr-3 pt-1.5 border-r">
                            <span className="text-xs font-medium text-muted-foreground">
                              {formatTimeDisplay(timeSlot)}
                            </span>
                          </div>

                          {/* Appointments area */}
                          <div className="flex-1 p-1.5 relative">
                            {/* Clickable empty slot for quick create */}
                            {slotAppointments.length === 0 && (
                              <button
                                className="absolute inset-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity border border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center"
                                onClick={() => {
                                  setFormStartTime(timeSlot)
                                  resetForm()
                                  setFormStartTime(timeSlot)
                                  setShowNewDialog(true)
                                }}
                              >
                                <Plus className="h-3 w-3 text-muted-foreground/40" />
                              </button>
                            )}

                            {/* Appointment blocks that start at this slot */}
                            {hasApptStart && slotAppointments
                              .filter((apt) => isAppointmentStart(timeSlot, apt))
                              .map((apt) => {
                                const span = getAppointmentSpan(apt)
                                const cfg = statusConfig[apt.status] || statusConfig.scheduled

                                return (
                                  <div
                                    key={apt.id}
                                    className={cn(
                                      'rounded-lg px-3 py-2 cursor-pointer transition-all hover:shadow-md border',
                                      'min-h-[40px]',
                                      cfg.bgClass,
                                      cfg.textClass,
                                      span > 1 && 'mb-1'
                                    )}
                                    style={{
                                      minHeight: `${span * 48 - 8}px`,
                                    }}
                                    onClick={() => handleEditAppointment(apt)}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <User className="h-3 w-3 shrink-0" />
                                          <span className="font-medium text-sm truncate">
                                            {apt.client.firstName} {apt.client.lastName}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <Scissors className="h-3 w-3 shrink-0 opacity-70" />
                                          <span className="text-xs opacity-80 truncate">
                                            {apt.services.map((s) => s.service.name).join(', ')}
                                          </span>
                                        </div>
                                        {apt.staff && (
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <Clock className="h-3 w-3 shrink-0 opacity-70" />
                                            <span className="text-xs opacity-70">
                                              {formatTimeDisplay(apt.startTime)} - {formatTimeDisplay(apt.endTime)} · {apt.staff.name}
                                            </span>
                                          </div>
                                        )}
                                        {!apt.staff && (
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <Clock className="h-3 w-3 shrink-0 opacity-70" />
                                            <span className="text-xs opacity-70">
                                              {formatTimeDisplay(apt.startTime)} - {formatTimeDisplay(apt.endTime)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          'text-[10px] px-1.5 py-0 h-5 shrink-0 border-0',
                                          cfg.bgClass,
                                          cfg.textClass
                                        )}
                                      >
                                        {cfg.label}
                                      </Badge>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* ─── New Appointment Dialog ──────────────────────────────── */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text">Nueva Cita</DialogTitle>
            <DialogDescription>
              Programa una nueva cita para el {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Date (read-only) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fecha</Label>
              <Input
                value={format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                readOnly
                className="bg-muted/50"
              />
            </div>

            {/* Client Combobox */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cliente</Label>
              <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientComboboxOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formClientId
                      ? (() => {
                          const c = clients.find((cl) => cl.id === formClientId)
                          return c ? `${c.firstName} ${c.lastName}` : 'Seleccionar cliente...'
                        })()
                      : 'Seleccionar cliente...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>No se encontró cliente</CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={`${client.firstName} ${client.lastName} ${client.phone || ''}`}
                            onSelect={() => {
                              setFormClientId(client.id)
                              setClientComboboxOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formClientId === client.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{client.firstName} {client.lastName}</span>
                              {client.phone && (
                                <span className="text-xs text-muted-foreground">{client.phone}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Service Multi-select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Servicios</Label>
              <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No hay servicios disponibles</p>
                ) : (
                  // Group by category
                  Object.entries(
                    services.reduce<Record<string, ServiceItem[]>>((acc, svc) => {
                      const cat = svc.category || 'General'
                      if (!acc[cat]) acc[cat] = []
                      acc[cat].push(svc)
                      return acc
                    }, {})
                  ).map(([category, svcs]) => (
                    <div key={category}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                        {category}
                      </p>
                      {svcs.map((svc) => (
                        <label
                          key={svc.id}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                            formServiceIds.includes(svc.id)
                              ? 'bg-primary/10'
                              : 'hover:bg-muted'
                          )}
                        >
                          <Checkbox
                            checked={formServiceIds.includes(svc.id)}
                            onCheckedChange={() => toggleService(svc.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm">{svc.name}</span>
                            <span className="text-xs text-muted-foreground ml-1">
                              ({svc.duration} min)
                            </span>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            {formatCLP(svc.price)}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))
                )}
              </div>
              {formServiceIds.length > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>
                    Duración total:{' '}
                    <span className="font-medium text-foreground">
                      {formServiceIds.reduce((sum, sid) => sum + (services.find((s) => s.id === sid)?.duration || 0), 0)} min
                    </span>
                  </span>
                  <span>
                    Total:{' '}
                    <span className="font-medium text-foreground">{formatCLP(totalPrice)}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Hora de inicio</Label>
              <Select value={formStartTime} onValueChange={setFormStartTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {formatTimeDisplay(slot)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculated End Time */}
            {calculatedEndTime && (
              <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Hora de fin estimada:{' '}
                  <span className="font-medium text-foreground">{formatTimeDisplay(calculatedEndTime)}</span>
                </span>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notas</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Notas adicionales sobre la cita..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
            >
              {isSubmitting ? 'Creando...' : 'Crear Cita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Appointment Dialog ─────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text">Editar Cita</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la cita
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fecha</Label>
              <Input
                value={format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                readOnly
                className="bg-muted/50"
              />
            </div>

            {/* Client Combobox */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cliente</Label>
              <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientComboboxOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formClientId
                      ? (() => {
                          const c = clients.find((cl) => cl.id === formClientId)
                          return c ? `${c.firstName} ${c.lastName}` : 'Seleccionar cliente...'
                        })()
                      : 'Seleccionar cliente...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>No se encontró cliente</CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={`${client.firstName} ${client.lastName} ${client.phone || ''}`}
                            onSelect={() => {
                              setFormClientId(client.id)
                              setClientComboboxOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formClientId === client.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{client.firstName} {client.lastName}</span>
                              {client.phone && (
                                <span className="text-xs text-muted-foreground">{client.phone}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Service Multi-select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Servicios</Label>
              <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                {Object.entries(
                  services.reduce<Record<string, ServiceItem[]>>((acc, svc) => {
                    const cat = svc.category || 'General'
                    if (!acc[cat]) acc[cat] = []
                    acc[cat].push(svc)
                    return acc
                  }, {})
                ).map(([category, svcs]) => (
                  <div key={category}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                      {category}
                    </p>
                    {svcs.map((svc) => (
                      <label
                        key={svc.id}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                          formServiceIds.includes(svc.id)
                            ? 'bg-primary/10'
                            : 'hover:bg-muted'
                        )}
                      >
                        <Checkbox
                          checked={formServiceIds.includes(svc.id)}
                          onCheckedChange={() => toggleService(svc.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm">{svc.name}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({svc.duration} min)
                          </span>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatCLP(svc.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              {formServiceIds.length > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>
                    Duración total:{' '}
                    <span className="font-medium text-foreground">
                      {formServiceIds.reduce((sum, sid) => sum + (services.find((s) => s.id === sid)?.duration || 0), 0)} min
                    </span>
                  </span>
                  <span>
                    Total:{' '}
                    <span className="font-medium text-foreground">{formatCLP(totalPrice)}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Hora de inicio</Label>
              <Select value={formStartTime} onValueChange={setFormStartTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {formatTimeDisplay(slot)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculated End Time */}
            {calculatedEndTime && (
              <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Hora de fin estimada:{' '}
                  <span className="font-medium text-foreground">{formatTimeDisplay(calculatedEndTime)}</span>
                </span>
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estado</Label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as AppointmentStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', cfg.dotClass)} />
                        {cfg.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notas</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Notas adicionales sobre la cita..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
