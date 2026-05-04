'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarCheck,
  Users,
  Heart,
  BarChart3,
  Zap,
  Bell,
  Scissors,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

const features = [
  {
    icon: CalendarCheck,
    title: 'Reservas automáticas',
    description:
      'Tus clientes agendan online 24/7. Confirmación automática por WhatsApp y email.',
    color: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  {
    icon: Users,
    title: 'Gestión de clientes',
    description:
      'Historial completo de cada cliente: servicios, preferencias, notas y frecuencia de visita.',
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    icon: Heart,
    title: 'Fidelización inteligente',
    description:
      'Programas de puntos, descuentos automáticos y campañas para mantener a tus clientas felices.',
    color: 'from-pink-500 to-pink-600',
    bg: 'bg-pink-50',
    iconColor: 'text-pink-600',
  },
  {
    icon: BarChart3,
    title: 'Dashboard en tiempo real',
    description:
      'Métricas clave de tu peluquería al instante: ingresos, ocupación, clientes nuevos y más.',
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Zap,
    title: 'Automatizaciones',
    description:
      'Recordatorios de cita, recuperación de clientes inactivos y descuentos de cumpleaños automático.',
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    icon: Bell,
    title: 'Alertas inteligentes',
    description:
      'Recibe notificaciones cuando un cliente no vuelve, cuando hay cancelaciones o cupos libres.',
    color: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export function LandingPage() {
  const { setCurrentView, login } = useAppStore()
  const [demoLoading, setDemoLoading] = useState(false)

  const handleDemo = async () => {
    setDemoLoading(true)
    try {
      // Seed demo data
      const seedRes = await fetch('/api/seed', { method: 'POST' })
      if (!seedRes.ok) {
        const data = await seedRes.json()
        throw new Error(data.error || 'Error al crear datos de demo')
      }

      // Login with demo credentials
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@glossy.cl', password: 'demo123' }),
      })

      if (!loginRes.ok) {
        const data = await loginRes.json()
        throw new Error(data.error || 'Error al iniciar sesión demo')
      }

      const user = await loginRes.json()
      login(user)
      setCurrentView('dashboard')
      toast.success('¡Bienvenida al demo de Glossy CRM!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar demo')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 glass border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Glossy CRM</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentView('login')}
                className="hidden sm:inline-flex"
              >
                Iniciar sesión
              </Button>
              <Button
                onClick={() => setCurrentView('register')}
                className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-rose-500/20"
              >
                Comenzar gratis
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-amber-50/50 to-white" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-rose-200/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-200/30 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-sm font-medium mb-8"
            >
              <Sparkles className="h-4 w-4" />
              El CRM #1 para peluquerías en Latinoamérica
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Tu peluquería,{' '}
              <span className="gradient-text">gestionada con inteligencia</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Reservas automáticas, fidelización de clientes y métricas en tiempo real.
              Todo lo que necesitas para hacer crecer tu negocio de belleza.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => setCurrentView('register')}
                className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white border-0 shadow-xl shadow-rose-500/25 text-base px-8 h-12"
              >
                Comenzar gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => setCurrentView('login')}
                className="text-base px-8 h-12 border-gray-300"
              >
                Iniciar sesión
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                Sin tarjeta de crédito
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                14 días gratis
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                Cancela cuando quieras
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para{' '}
              <span className="gradient-text">hacer crecer tu negocio</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Herramientas diseñadas específicamente para peluquerías y salones de belleza.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0zMHY2aC02VjRoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Empieza a transformar tu peluquería hoy
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Únete a cientos de peluquerías que ya usan Glossy CRM para fidelizar clientes y crecer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => setCurrentView('register')}
                className="bg-white text-rose-600 hover:bg-gray-50 shadow-xl text-base px-8 h-12 font-semibold"
              >
                Comenzar gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                size="lg"
                onClick={handleDemo}
                disabled={demoLoading}
                className="bg-white/10 text-white hover:bg-white/20 border border-white/25 text-base px-8 h-12"
              >
                {demoLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Cargando demo...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Probar demo
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center">
                <Scissors className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">Glossy CRM</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-gray-500">
              <span>Gestión inteligente para peluquerías</span>
            </div>

            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Glossy CRM. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
