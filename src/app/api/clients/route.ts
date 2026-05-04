import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { salonId: user.salonId }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const clients = await db.client.findMany({
      where,
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        clientNotes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Enrich with computed fields
    const enriched = await Promise.all(
      clients.map(async (client) => {
        const totalAppointments = await db.appointment.count({
          where: { clientId: client.id },
        })
        const completedAppointments = await db.appointment.count({
          where: { clientId: client.id, status: 'completed' },
        })
        const lastAppointment = await db.appointment.findFirst({
          where: { clientId: client.id, status: 'completed' },
          orderBy: { date: 'desc' },
        })

        // Calculate days since last visit
        let daysSinceLastVisit: number | null = null
        if (lastAppointment) {
          const diff = Date.now() - new Date(lastAppointment.date).getTime()
          daysSinceLastVisit = Math.floor(diff / (1000 * 60 * 60 * 24))
        }

        return {
          ...client,
          totalAppointments,
          completedAppointments,
          daysSinceLastVisit,
        }
      })
    )

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { firstName, lastName, email, phone, notes, preferences, source } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Nombre y apellido son requeridos' }, { status: 400 })
    }

    const client = await db.client.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
        preferences: preferences ? JSON.stringify(preferences) : null,
        source: source || null,
        salonId: user.salonId,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}
