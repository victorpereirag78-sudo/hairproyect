'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scissors, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export function LoginForm() {
  const { setCurrentView, login } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión')
      }

      login(data)
      setCurrentView('dashboard')
      toast.success('¡Bienvenida de vuelta!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50/50 to-white p-4">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-rose-200/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-amber-200/30 to-transparent rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">Glossy CRM</span>
        </div>

        <Card className="border-gray-200/60 shadow-xl shadow-gray-200/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
            <CardDescription>
              Ingresa a tu cuenta para gestionar tu peluquería
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-rose-500/20 h-11"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => setCurrentView('register')}
                className="text-rose-600 hover:text-rose-700 font-medium transition-colors"
              >
                Registrarse
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
