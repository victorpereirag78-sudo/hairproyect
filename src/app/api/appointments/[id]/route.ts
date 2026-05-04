import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

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
    const { date, startTime, endTime, status, notes, staffId, serviceIds } = body

    const existing = await db.appointment.findFirst({
      where: { id, salonId: user.salonId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    // Update basic fields
    const updateData: Record<string, unknown> = {}
    if (date) updateData.date = new Date(date)
    if (startTime) updateData.startTime = startTime
    if (endTime) updateData.endTime = endTime
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes || null
    if (staffId !== undefined) updateData.staffId = staffId || null

    // Update services if provided
    if (serviceIds?.length) {
      await db.appointmentService.deleteMany({
        where: { appointmentId: id },
      })
      await db.appointmentService.createMany({
        data: serviceIds.map((serviceId: string) => ({
          appointmentId: id,
          serviceId,
        })),
      })
    }

    const appointment = await db.appointment.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        services: { include: { service: true } },
        staff: true,
      },
    })

    // Update client status based on appointment
    if (status === 'completed') {
      const completedCount = await db.appointment.count({
        where: { clientId: existing.clientId, status: 'completed' },
      })
      if (completedCount >= 2) {
        await db.client.update({
          where: { id: existing.clientId },
          data: { status: 'recurring' },
        })
      }
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json({ error: 'Error al actualizar cita' }, { status: 500 })
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
    const existing = await db.appointment.findFirst({
      where: { id, salonId: user.salonId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    await db.appointment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete appointment error:', error)
    return NextResponse.json({ error: 'Error al eliminar cita' }, { status: 500 })
  }
}
