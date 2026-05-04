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
    const { name, duration, price, category, active } = body

    const existing = await db.service.findFirst({
      where: { id, salonId: user.salonId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    const service = await db.service.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        duration: duration !== undefined ? Number(duration) : existing.duration,
        price: price !== undefined ? Number(price) : existing.price,
        category: category !== undefined ? category || null : existing.category,
        active: active !== undefined ? active : existing.active,
      },
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Update service error:', error)
    return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 500 })
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
    const existing = await db.service.findFirst({
      where: { id, salonId: user.salonId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    await db.service.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json({ error: 'Error al eliminar servicio' }, { status: 500 })
  }
}
