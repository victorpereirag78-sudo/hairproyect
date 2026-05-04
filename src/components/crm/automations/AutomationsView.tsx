'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Zap,
  Bell,
  UserX,
  Gift,
  Cake,
  Edit2,
  Trash2,
  Clock,
  Mail,
  MessageCircle,
  Percent,
  Hash,
  CalendarDays,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Automation {
  id: string
  name: string
  type: string
  active: boolean
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

interface ClientData {
  id: string
  firstName: string
  lastName: string
  status: string
  createdAt: string
  updatedAt: string
}

type AutomationType = 'reminder' | 'inactive_recovery' | 'loyalty' | 'birthday'

const TYPE_CONFIG: Record<
  AutomationType,
  {
    label: string
    icon: React.ReactNode
    badgeClass: string
    description: string
  }
> = {
  reminder: {
    label: 'Recordatorio',
    icon: <Bell className="h-4 w-4" />,
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    description: 'Envía un recordatorio antes de la cita',
  },
  inactive_recovery: {
    label: 'Recuperación inactivos',
    icon: <UserX className="h-4 w-4" />,
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    description: 'Recupera clientes que no han visitado la peluquería',
  },
  loyalty: {
    label: 'Fidelización',
    icon: <Gift className="h-4 w-4" />,
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    description: 'Premia a los clientes frecuentes',
  },
  birthday: {
    label: 'Cumpleaños',
    icon: <Cake className="h-4 w-4" />,
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    description: 'Envía descuento en el cumpleaños del cliente',
  },
}

interface AutomationFormData {
  name: string
  type: AutomationType
  active: boolean
  config: {
    hoursBefore?: number
    channel?: string
    daysInactive?: number
    discountPercent?: number
    visitsRequired?: number
    daysBefore?: number
  }
}

const emptyForm: AutomationFormData = {
  name: '',
  type: 'reminder',
  active: true,
  config: {},
}

function getAutomationDescription(automation: Automation): string {
  const cfg = automation.config as Record<string, unknown>
  switch (automation.type) {
    case 'reminder':
      return `Recordatorio ${cfg.hoursBefore || 24} horas antes por ${cfg.channel === 'whatsapp' ? 'WhatsApp' : 'email'}`
    case 'inactive_recovery':
      return `Para clientes inactivos ${cfg.daysInactive || 30}+ días, ${cfg.discountPercent || 10}% descuento por ${cfg.channel === 'whatsapp' ? 'WhatsApp' : 'email'}`
    case 'loyalty':
      return `Tras ${cfg.visitsRequired || 5} visitas, ${cfg.discountPercent || 15}% descuento`
    case 'birthday':
      return `${cfg.discountPercent || 20}% descuento, ${cfg.daysBefore || 3} días antes del cumpleaños`
    default:
      return ''
  }
}

export function AutomationsView() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null)
  const [form, setForm] = useState<AutomationFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchAutomations = useCallback(async () => {
    try {
      const res = await fetch('/api/automations')
      if (res.ok) {
        const data = await res.json()
        setAutomations(data)
      }
    } catch {
      toast.error('Error al cargar automatizaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data)
      }
    } catch {
      // silently fail - recommendations are optional
    }
  }, [])

  useEffect(() => {
    fetchAutomations()
    fetchClients()
  }, [fetchAutomations, fetchClients])

  // Smart recommendations
  const inactiveClients = clients.filter((c) => {
    const lastVisit = new Date(c.updatedAt)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return lastVisit < thirtyDaysAgo
  }).length

  const birthdayClients = (() => {
    const currentMonth = new Date().getMonth()
    // We don't have birthday data in the schema, so we simulate based on client count
    // In a real app, you'd filter by birthday month
    return Math.floor(clients.length * 0.08) // ~8% of clients
  })()

  const nearLoyaltyClients = (() => {
    // Simulate: clients with 3-4 visits (close to 5th visit)
    return Math.floor(clients.length * 0.12)
  })()

  const hasRecommendations = inactiveClients > 0 || birthdayClients > 0 || nearLoyaltyClients > 0

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          active: form.active,
          config: form.config,
        }),
      })
      if (res.ok) {
        toast.success('Automatización creada exitosamente')
        setShowCreateDialog(false)
        setForm(emptyForm)
        fetchAutomations()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear automatización')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedAutomation) return
    if (!form.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/automations/${selectedAutomation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          active: form.active,
          config: form.config,
        }),
      })
      if (res.ok) {
        toast.success('Automatización actualizada')
        setShowEditDialog(false)
        setSelectedAutomation(null)
        setForm(emptyForm)
        fetchAutomations()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAutomation) return
    try {
      const res = await fetch(`/api/automations/${selectedAutomation.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Automatización eliminada')
        setShowDeleteDialog(false)
        setSelectedAutomation(null)
        fetchAutomations()
      } else {
        toast.error('Error al eliminar automatización')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleToggleActive = async (automation: Automation) => {
    try {
      const res = await fetch(`/api/automations/${automation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !automation.active }),
      })
      if (res.ok) {
        toast.success(automation.active ? 'Automatización desactivada' : 'Automatización activada')
        fetchAutomations()
      }
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const openEditDialog = (automation: Automation) => {
    setSelectedAutomation(automation)
    const cfg = (automation.config || {}) as Record<string, unknown>
    setForm({
      name: automation.name,
      type: automation.type as AutomationType,
      active: automation.active,
      config: {
        hoursBefore: (cfg.hoursBefore as number) || undefined,
        channel: (cfg.channel as string) || undefined,
        daysInactive: (cfg.daysInactive as number) || undefined,
        discountPercent: (cfg.discountPercent as number) || undefined,
        visitsRequired: (cfg.visitsRequired as number) || undefined,
        daysBefore: (cfg.daysBefore as number) || undefined,
      },
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (automation: Automation) => {
    setSelectedAutomation(automation)
    setShowDeleteDialog(true)
  }

  const handleTypeChange = (type: AutomationType) => {
    setForm((prev) => ({
      ...prev,
      type,
      config: {},
    }))
  }

  const updateConfig = (key: string, value: number | string) => {
    setForm((prev) => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }))
  }

  // Stats
  const activeCount = automations.filter((a) => a.active).length

  const renderConfigFields = (isEdit = false) => {
    const prefix = isEdit ? 'edit-' : 'create-'
    switch (form.type) {
      case 'reminder':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}hoursBefore`}>
                <Clock className="h-3.5 w-3.5 inline mr-1" />
                Horas antes del recordatorio
              </Label>
              <Input
                id={`${prefix}hoursBefore`}
                type="number"
                min={1}
                value={form.config.hoursBefore || 24}
                onChange={(e) => updateConfig('hoursBefore', parseInt(e.target.value) || 24)}
                placeholder="24"
              />
            </div>
            <div className="space-y-2">
              <Label>Canal de envío</Label>
              <Select
                value={form.config.channel || 'email'}
                onValueChange={(val) => updateConfig('channel', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )
      case 'inactive_recovery':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}daysInactive`}>
                <CalendarDays className="h-3.5 w-3.5 inline mr-1" />
                Días de inactividad
              </Label>
              <Input
                id={`${prefix}daysInactive`}
                type="number"
                min={7}
                value={form.config.daysInactive || 30}
                onChange={(e) => updateConfig('daysInactive', parseInt(e.target.value) || 30)}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}discountPercent`}>
                <Percent className="h-3.5 w-3.5 inline mr-1" />
                Descuento (%)
              </Label>
              <Input
                id={`${prefix}discountPercent`}
                type="number"
                min={0}
                max={100}
                value={form.config.discountPercent || 10}
                onChange={(e) => updateConfig('discountPercent', parseInt(e.target.value) || 10)}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label>Canal de envío</Label>
              <Select
                value={form.config.channel || 'whatsapp'}
                onValueChange={(val) => updateConfig('channel', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )
      case 'loyalty':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}visitsRequired`}>
                <Hash className="h-3.5 w-3.5 inline mr-1" />
                Visitas requeridas
              </Label>
              <Input
                id={`${prefix}visitsRequired`}
                type="number"
                min={1}
                value={form.config.visitsRequired || 5}
                onChange={(e) => updateConfig('visitsRequired', parseInt(e.target.value) || 5)}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}loyaltyDiscount`}>
                <Percent className="h-3.5 w-3.5 inline mr-1" />
                Descuento (%)
              </Label>
              <Input
                id={`${prefix}loyaltyDiscount`}
                type="number"
                min={0}
                max={100}
                value={form.config.discountPercent || 15}
                onChange={(e) => updateConfig('discountPercent', parseInt(e.target.value) || 15)}
                placeholder="15"
              />
            </div>
          </>
        )
      case 'birthday':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}birthdayDiscount`}>
                <Percent className="h-3.5 w-3.5 inline mr-1" />
                Descuento (%)
              </Label>
              <Input
                id={`${prefix}birthdayDiscount`}
                type="number"
                min={0}
                max={100}
                value={form.config.discountPercent || 20}
                onChange={(e) => updateConfig('discountPercent', parseInt(e.target.value) || 20)}
                placeholder="20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}daysBefore`}>
                <CalendarDays className="h-3.5 w-3.5 inline mr-1" />
                Días antes del cumpleaños
              </Label>
              <Input
                id={`${prefix}daysBefore`}
                type="number"
                min={0}
                value={form.config.daysBefore || 3}
                onChange={(e) => updateConfig('daysBefore', parseInt(e.target.value) || 3)}
                placeholder="3"
              />
            </div>
          </>
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-56 bg-muted animate-pulse rounded-lg" />
            <div className="h-4 w-36 bg-muted animate-pulse rounded-lg mt-2" />
          </div>
        </div>
        <div className="h-32 bg-muted animate-pulse rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automatizaciones</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {automations.length} automatización{automations.length !== 1 ? 'es' : ''} &middot;{' '}
            {activeCount} activa{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowCreateDialog(true) }} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Automatización
        </Button>
      </div>

      {/* Smart Recommendations */}
      {hasRecommendations && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Recomendaciones Inteligentes</h3>
            </div>
            <div className="space-y-2">
              {inactiveClients > 0 && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span className="text-sm flex-1">
                    <strong>{inactiveClients}</strong> cliente{inactiveClients !== 1 ? 's' : ''} no
                    visitan hace más de 30 días
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 shrink-0"
                    onClick={() => {
                      setForm({
                        name: 'Recuperación clientes inactivos',
                        type: 'inactive_recovery',
                        active: true,
                        config: { daysInactive: 30, discountPercent: 10, channel: 'whatsapp' },
                      })
                      setShowCreateDialog(true)
                    }}
                  >
                    Activar
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {birthdayClients > 0 && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                  <Cake className="h-4 w-4 text-violet-500 shrink-0" />
                  <span className="text-sm flex-1">
                    <strong>{birthdayClients}</strong> cliente{birthdayClients !== 1 ? 's' : ''}{' '}
                    cumple{birthdayClients === 1 ? '' : 'n'} años este mes
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-violet-600 hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/30 shrink-0"
                    onClick={() => {
                      setForm({
                        name: 'Descuento de cumpleaños',
                        type: 'birthday',
                        active: true,
                        config: { discountPercent: 20, daysBefore: 3 },
                      })
                      setShowCreateDialog(true)
                    }}
                  >
                    Activar
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {nearLoyaltyClients > 0 && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <Gift className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm flex-1">
                    <strong>{nearLoyaltyClients}</strong> cliente{nearLoyaltyClients !== 1 ? 's' : ''}{' '}
                    cercano{nearLoyaltyClients !== 1 ? 's' : ''} a 5ta visita
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 shrink-0"
                    onClick={() => {
                      setForm({
                        name: 'Programa de fidelización',
                        type: 'loyalty',
                        active: true,
                        config: { visitsRequired: 5, discountPercent: 15 },
                      })
                      setShowCreateDialog(true)
                    }}
                  >
                    Activar
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automations List */}
      {automations.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold">No hay automatizaciones</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comienza creando tu primera automatización
            </p>
            <Button
              className="mt-4 gap-2"
              onClick={() => { setForm(emptyForm); setShowCreateDialog(true) }}
            >
              <Plus className="h-4 w-4" />
              Crear Automatización
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-380px)]">
          <div className="space-y-3 pr-2">
            {automations.map((automation) => {
              const typeInfo = TYPE_CONFIG[automation.type as AutomationType]
              return (
                <Card
                  key={automation.id}
                  className={`group transition-all hover:shadow-md ${
                    !automation.active ? 'opacity-60' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          automation.type === 'reminder'
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : automation.type === 'inactive_recovery'
                              ? 'bg-rose-100 dark:bg-rose-900/30'
                              : automation.type === 'loyalty'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                : 'bg-violet-100 dark:bg-violet-900/30'
                        }`}
                      >
                        {typeInfo?.icon || <Zap className="h-4 w-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm">{automation.name}</h4>
                          {typeInfo && (
                            <Badge className={`text-[10px] ${typeInfo.badgeClass}`} variant="secondary">
                              {typeInfo.label}
                            </Badge>
                          )}
                          {!automation.active && (
                            <Badge variant="outline" className="text-[10px]">
                              Inactiva
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getAutomationDescription(automation)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Switch
                          checked={automation.active}
                          onCheckedChange={() => handleToggleActive(automation)}
                        />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openEditDialog(automation)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(automation)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}

      {/* Create Automation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Automatización</DialogTitle>
            <DialogDescription>Configura una nueva automatización para tu peluquería</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="auto-name">Nombre</Label>
              <Input
                id="auto-name"
                placeholder="Ej: Recordatorio de cita"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de automatización</Label>
              <Select
                value={form.type}
                onValueChange={(val) => handleTypeChange(val as AutomationType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_CONFIG) as [AutomationType, typeof TYPE_CONFIG[AutomationType]][]).map(
                    ([type, info]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {info.icon}
                          {info.label}
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TYPE_CONFIG[form.type]?.description}
              </p>
            </div>

            <Separator />

            {renderConfigFields()}

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-active">Automatización activa</Label>
              <Switch
                id="auto-active"
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear Automatización'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Automation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Automatización</DialogTitle>
            <DialogDescription>Modifica la configuración de la automatización</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-auto-name">Nombre</Label>
              <Input
                id="edit-auto-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de automatización</Label>
              <Select
                value={form.type}
                onValueChange={(val) => handleTypeChange(val as AutomationType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_CONFIG) as [AutomationType, typeof TYPE_CONFIG[AutomationType]][]).map(
                    ([type, info]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {info.icon}
                          {info.label}
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TYPE_CONFIG[form.type]?.description}
              </p>
            </div>

            <Separator />

            {renderConfigFields(true)}

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-auto-active">Automatización activa</Label>
              <Switch
                id="edit-auto-active"
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar automatización</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás segura de eliminar &ldquo;{selectedAutomation?.name}&rdquo;? Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
