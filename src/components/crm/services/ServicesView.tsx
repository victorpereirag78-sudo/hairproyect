'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Search,
  Scissors,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  Tag,
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

interface Service {
  id: string
  name: string
  duration: number
  price: number
  category: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

const CATEGORY_SUGGESTIONS = ['Corte', 'Color', 'Tratamiento', 'Peinado', 'Combo']

const CATEGORY_COLORS: Record<string, string> = {
  Corte: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  Color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  Tratamiento: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Peinado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Combo: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
}

const CATEGORY_ICONS: Record<string, string> = {
  Corte: '✂️',
  Color: '🎨',
  Tratamiento: '💆',
  Peinado: '💇',
  Combo: '⭐',
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface ServiceFormData {
  name: string
  duration: number
  price: number
  category: string
  active: boolean
}

const emptyForm: ServiceFormData = {
  name: '',
  duration: 30,
  price: 0,
  category: '',
  active: true,
}

export function ServicesView() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [form, setForm] = useState<ServiceFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/services')
      if (res.ok) {
        const data = await res.json()
        setServices(data)
      }
    } catch {
      toast.error('Error al cargar servicios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  // Group services by category
  const groupedServices = services.reduce<Record<string, Service[]>>((acc, service) => {
    const cat = service.category || 'Sin categoría'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(service)
    return acc
  }, {})

  // Filter services
  const filteredGrouped = Object.entries(groupedServices).reduce<Record<string, Service[]>>(
    (acc, [category, items]) => {
      if (categoryFilter !== 'all' && category !== categoryFilter) return acc

      const filtered = items.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      if (filtered.length > 0) acc[category] = filtered
      return acc
    },
    {}
  )

  const allCategories = Array.from(new Set(services.map((s) => s.category || 'Sin categoría')))

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    if (!form.duration || form.duration <= 0) {
      toast.error('La duración debe ser mayor a 0')
      return
    }
    if (form.price < 0) {
      toast.error('El precio no puede ser negativo')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          duration: form.duration,
          price: form.price,
          category: form.category || null,
          active: form.active,
        }),
      })
      if (res.ok) {
        toast.success('Servicio creado exitosamente')
        setShowCreateDialog(false)
        setForm(emptyForm)
        fetchServices()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear servicio')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedService) return
    if (!form.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/services/${selectedService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          duration: form.duration,
          price: form.price,
          category: form.category || null,
          active: form.active,
        }),
      })
      if (res.ok) {
        toast.success('Servicio actualizado')
        setShowEditDialog(false)
        setSelectedService(null)
        setForm(emptyForm)
        fetchServices()
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
    if (!selectedService) return
    try {
      const res = await fetch(`/api/services/${selectedService.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Servicio eliminado')
        setShowDeleteDialog(false)
        setSelectedService(null)
        fetchServices()
      } else {
        toast.error('Error al eliminar servicio')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.active }),
      })
      if (res.ok) {
        toast.success(service.active ? 'Servicio desactivado' : 'Servicio activado')
        fetchServices()
      }
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const openEditDialog = (service: Service) => {
    setSelectedService(service)
    setForm({
      name: service.name,
      duration: service.duration,
      price: service.price,
      category: service.category || '',
      active: service.active,
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (service: Service) => {
    setSelectedService(service)
    setShowDeleteDialog(true)
  }

  // Stats
  const activeCount = services.filter((s) => s.active).length
  const inactiveCount = services.filter((s) => !s.active).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded-lg mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
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
          <h2 className="text-2xl font-bold tracking-tight">Servicios</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {services.length} servicio{services.length !== 1 ? 's' : ''} &middot; {activeCount} activo{activeCount !== 1 ? 's' : ''} &middot; {inactiveCount} inactivo{inactiveCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowCreateDialog(true) }} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar servicios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service Grid by Category */}
      {Object.keys(filteredGrouped).length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Scissors className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold">
              {services.length === 0 ? 'No hay servicios' : 'Sin resultados'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {services.length === 0
                ? 'Comienza agregando tu primer servicio'
                : 'Intenta ajustar los filtros de búsqueda'}
            </p>
            {services.length === 0 && (
              <Button
                className="mt-4 gap-2"
                onClick={() => { setForm(emptyForm); setShowCreateDialog(true) }}
              >
                <Plus className="h-4 w-4" />
                Crear Servicio
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-280px)]">
          <div className="space-y-6 pr-2">
            {Object.entries(filteredGrouped).map(([category, categoryServices]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{CATEGORY_ICONS[category] || '📋'}</span>
                  <h3 className="font-semibold text-base">{category}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {categoryServices.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryServices.map((service) => (
                    <Card
                      key={service.id}
                      className={`group transition-all hover:shadow-md ${
                        !service.active ? 'opacity-60' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm truncate">{service.name}</h4>
                              {!service.active && (
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  Inactivo
                                </Badge>
                              )}
                            </div>
                            {service.category && (
                              <Badge
                                className={`mt-1.5 text-[10px] ${
                                  CATEGORY_COLORS[service.category] || ''
                                }`}
                                variant="secondary"
                              >
                                <Tag className="h-2.5 w-2.5 mr-0.5" />
                                {service.category}
                              </Badge>
                            )}
                          </div>
                          <Switch
                            checked={service.active}
                            onCheckedChange={() => handleToggleActive(service)}
                            className="shrink-0"
                          />
                        </div>

                        <Separator className="my-3" />

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{service.duration} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">
                              {formatCLP(service.price)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => openEditDialog(service)}
                          >
                            <Edit2 className="h-3 w-3" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(service)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Eliminar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Create Service Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Servicio</DialogTitle>
            <DialogDescription>Agrega un nuevo servicio a tu peluquería</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="svc-name">Nombre *</Label>
              <Input
                id="svc-name"
                placeholder="Ej: Corte de pelo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="svc-duration">Duración (min) *</Label>
                <Input
                  id="svc-duration"
                  type="number"
                  min={5}
                  step={5}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-price">Precio (CLP) *</Label>
                <Input
                  id="svc-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-category">Categoría</Label>
              <div className="flex gap-2">
                <Input
                  id="svc-category"
                  placeholder="Ej: Corte"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value=""
                  onValueChange={(val) => {
                    if (val) setForm({ ...form, category: val })
                  }}
                >
                  <SelectTrigger className="w-10 px-2">
                    <SelectValue placeholder="▼" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_SUGGESTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_ICONS[cat]} {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {CATEGORY_SUGGESTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      form.category === cat
                        ? CATEGORY_COLORS[cat] || 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {CATEGORY_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="svc-active">Servicio activo</Label>
              <Switch
                id="svc-active"
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
              {submitting ? 'Creando...' : 'Crear Servicio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
            <DialogDescription>Modifica los datos del servicio</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duración (min) *</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min={5}
                  step={5}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Precio (CLP) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoría</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value=""
                  onValueChange={(val) => {
                    if (val) setForm({ ...form, category: val })
                  }}
                >
                  <SelectTrigger className="w-10 px-2">
                    <SelectValue placeholder="▼" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_SUGGESTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_ICONS[cat]} {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {CATEGORY_SUGGESTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      form.category === cat
                        ? CATEGORY_COLORS[cat] || 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {CATEGORY_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Servicio activo</Label>
              <Switch
                id="edit-active"
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
            <AlertDialogTitle>Eliminar servicio</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás segura de eliminar &ldquo;{selectedService?.name}&rdquo;? Esta acción no se
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
