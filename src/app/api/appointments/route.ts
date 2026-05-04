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
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    const where: Record<string, unknown> = { salonId: user.salonId }
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const appointments = await db.appointment.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        services: { include: { service: true } },
        staff: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { date, startTime, endTime, clientId, serviceIds, staffId, notes, status } = body

    if (!date || !startTime || !endTime || !clientId || !serviceIds?.length) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const appointment = await db.appointment.create({
      data: {
        date: new Date(date),
        startTime,
        endTime,
        clientId,
        staffId: staffId || null,
        salonId: user.salonId,
        notes: notes || null,
        status: status || 'scheduled',
        services: {
          create: serviceIds.map((serviceId: string) => ({
            serviceId,
          })),
        },
      },
      include: {
        client: true,
        services: { include: { service: true } },
        staff: true,
      },
    })

    // Create notification for the appointment
    await db.notification.create({
      data: {
        title: 'Nueva cita creada',
        message: `Cita para ${appointment.client.firstName} ${appointment.client.lastName} el ${new Date(appointment.date).toLocaleDateString('es-CL')} a las ${appointment.startTime}`,
        type: 'info',
        userId: user.id,
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json({ error: 'Error al crear cita' }, { status: 500 })
  }
}
