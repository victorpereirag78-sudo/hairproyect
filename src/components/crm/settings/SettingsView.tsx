'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Store,
  User,
  Database,
  Info,
  Clock,
  Mail,
  Phone,
  MapPin,
  Scissors,
  Loader2,
  CheckCircle2,
  Sparkles,
  CalendarDays,
  Users,
  Zap,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'

const APP_VERSION = '1.0.0'

const DAY_NAMES: Record<string, string> = {
  '0': 'Domingo',
  '1': 'Lunes',
  '2': 'Martes',
  '3': 'Miércoles',
  '4': 'Jueves',
  '5': 'Viernes',
  '6': 'Sábado',
}

function formatWorkDays(workDaysStr: string | null | undefined): string {
  if (!workDaysStr) return 'No configurado'
  const days = workDaysStr.split(',').map((d) => DAY_NAMES[d.trim()]).filter(Boolean)
  return days.join(', ') || 'No configurado'
}

function formatTime(time: string | null | undefined): string {
  if (!time) return '--:--'
  return time
}

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  staff: 'secondary',
}

const roleLabel: Record<string, string> = {
  owner: 'Propietario',
  staff: 'Personal',
}

export function SettingsView() {
  const { user } = useAppStore()
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Datos de demostración cargados correctamente')
        setSeeded(true)
        setDialogOpen(false)
      } else {
        toast.error(data.error || 'Error al cargar datos de demostración')
      }
    } catch {
      toast.error('Error de conexión al cargar datos de demostración')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona la información de tu salón y preferencias de la aplicación.
        </p>
      </div>

      {/* Salon Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Perfil del Salón</CardTitle>
              <CardDescription>Información de tu peluquería</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Salon Name */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="h-3 w-3" />
                Nombre del Salón
              </Label>
              <p className="text-sm font-medium px-3 py-2 rounded-md bg-muted/50">
                {user?.salonName || 'No configurado'}
              </p>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                Dirección
              </Label>
              <p className="text-sm font-medium px-3 py-2 rounded-md bg-muted/50">
                Av. Providencia 1234, Santiago
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                Teléfono
              </Label>
              <p className="text-sm font-medium px-3 py-2 rounded-md bg-muted/50">
                +56 9 1234 5678
              </p>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <p className="text-sm font-medium px-3 py-2 rounded-md bg-muted/50">
                contacto@glossy.cl
              </p>
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Horario de Atención
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/50">
                <span className="text-xs text-muted-foreground">Apertura</span>
                <span className="text-sm font-semibold">09:00</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/50">
                <span className="text-xs text-muted-foreground">Cierre</span>
                <span className="text-sm font-semibold">19:00</span>
              </div>
            </div>
            <div className="px-3 py-2 rounded-md bg-muted/50">
              <span className="text-xs text-muted-foreground">Días laborales: </span>
              <span className="text-sm font-medium">
                {formatWorkDays('1,2,3,4,5,6')}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic flex items-center gap-1">
            <Info className="h-3 w-3" />
            La edición del perfil del salón estará disponible próximamente.
          </p>
        </CardContent>
      </Card>

      {/* My Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Mi Perfil</CardTitle>
              <CardDescription>Tu información personal</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nombre</Label>
              <p className="text-sm font-medium px-3 py-2 rounded-md bg-muted/50">
                {user?.name || 'No configurado'}
              </p>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <p className="text-sm font-medium px-3 py-2 rounded-md bg-muted/50">
                {user?.email || 'No configurado'}
              </p>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                Rol
              </Label>
              <div className="px-3 py-2">
                <Badge variant={roleBadgeVariant[user?.role || 'owner'] || 'outline'} className="text-xs">
                  {roleLabel[user?.role || 'owner'] || user?.role}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Data Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Database className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Datos Demo</CardTitle>
              <CardDescription>Carga datos de ejemplo para explorar la aplicación</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {seeded ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Datos de demostración cargados
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Inicia sesión con demo@glossy.cl / demo123
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Carga datos de ejemplo para probar todas las funcionalidades de Glossy CRM sin afectar datos reales.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="h-4 w-4 text-rose-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">10 Clientes</p>
                    <p className="text-xs text-muted-foreground">Con notas y preferencias</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Scissors className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">10 Servicios</p>
                    <p className="text-xs text-muted-foreground">Cortes, color, tratamientos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CalendarDays className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">24 Citas</p>
                    <p className="text-xs text-muted-foreground">Pasadas, hoy y futuras</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Zap className="h-4 w-4 text-violet-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">4 Automatizaciones</p>
                    <p className="text-xs text-muted-foreground">Recordatorios y fidelización</p>
                  </div>
                </div>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto gap-2">
                    <Sparkles className="h-4 w-4" />
                    Cargar datos de demostración
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cargar datos de demostración</DialogTitle>
                    <DialogDescription>
                      Esto creará datos de ejemplo en la base de datos incluyendo clientes, servicios,
                      citas y automatizaciones. Si ya existen datos demo, se mostrarán las credenciales existentes.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-3">
                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                      <p className="text-sm font-medium">Datos que se crearán:</p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                        <li>1 cuenta de propietario (demo@glossy.cl)</li>
                        <li>2 cuentas de personal</li>
                        <li>10 clientes con notas y preferencias</li>
                        <li>10 servicios de peluquería</li>
                        <li>24 citas (pasadas y futuras)</li>
                        <li>4 automatizaciones activas</li>
                      </ul>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={seeding}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSeed} disabled={seeding}>
                      {seeding ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Cargando...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4 mr-2" />
                          Cargar datos
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center">
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Acerca de</CardTitle>
              <CardDescription>Información de la aplicación</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg">
              <Scissors className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold gradient-text">Glossy CRM</h3>
              <p className="text-sm text-muted-foreground">Gestión inteligente para peluquerías</p>
              <Badge variant="outline" className="mt-1.5 text-xs">
                v{APP_VERSION}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Glossy CRM es un sistema de gestión diseñado específicamente para peluquerías y salones de belleza.
              Organiza tus citas, gestiona tus clientes, automatiza recordatorios y crece tu negocio de forma inteligente.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <CalendarDays className="h-5 w-5 mx-auto text-rose-500 mb-1" />
                <p className="text-xs font-medium">Calendario</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                <p className="text-xs font-medium">Clientes</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Zap className="h-5 w-5 mx-auto text-violet-500 mb-1" />
                <p className="text-xs font-medium">Automatización</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Store className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                <p className="text-xs font-medium">Gestión</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
