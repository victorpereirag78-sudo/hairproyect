import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const client = await db.client.findFirst({
      where: { id, salonId: user.salonId },
      include: {
        appointments: {
          include: {
            services: { include: { service: true } },
            staff: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
        },
        clientNotes: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Compute stats
    const totalAppointments = client.appointments.length
    const completedAppointments = client.appointments.filter(a => a.status === 'completed').length
    const totalSpent = client.appointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + a.services.reduce((s, as) => s + as.service.price, 0), 0)

    const lastAppointment = client.appointments.find(a => a.status === 'completed')
    let daysSinceLastVisit: number | null = null
    if (lastAppointment) {
      const diff = Date.now() - new Date(lastAppointment.date).getTime()
      daysSinceLastVisit = Math.floor(diff / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      ...client,
      preferences: client.preferences ? JSON.parse(client.preferences) : null,
      totalAppointments,
      completedAppointments,
      totalSpent,
      daysSinceLastVisit,
    })
  } catch (error) {
    console.error('Get client error:', error)
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { firstName, lastName, email, phone, status, notes, preferences, source } = body

    const client = await db.client.findFirst({
      where: { id, salonId: user.salonId },
    })
    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const updated = await db.client.update({
      where: { id },
      data: {
        firstName: firstName ?? client.firstName,
        lastName: lastName ?? client.lastName,
        email: email !== undefined ? email || null : client.email,
        phone: phone !== undefined ? phone || null : client.phone,
        status: status ?? client.status,
        notes: notes !== undefined ? notes || null : client.notes,
        preferences: preferences ? JSON.stringify(preferences) : client.preferences,
        source: source !== undefined ? source || null : client.source,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const client = await db.client.findFirst({
      where: { id, salonId: user.salonId },
    })
    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    await db.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 })
  }
}
