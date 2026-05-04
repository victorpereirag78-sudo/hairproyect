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
    const { name, type, active, config } = body

    const existing = await db.automation.findFirst({
      where: { id, salonId: user.salonId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Automatización no encontrada' }, { status: 404 })
    }

    const automation = await db.automation.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        type: type ?? existing.type,
        active: active !== undefined ? active : existing.active,
        config: config ? JSON.stringify(config) : existing.config,
      },
    })

    return NextResponse.json({
      ...automation,
      config: JSON.parse(automation.config),
    })
  } catch (error) {
    console.error('Update automation error:', error)
    return NextResponse.json({ error: 'Error al actualizar automatización' }, { status: 500 })
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
    const existing = await db.automation.findFirst({
      where: { id, salonId: user.salonId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Automatización no encontrada' }, { status: 404 })
    }

    await db.automation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete automation error:', error)
    return NextResponse.json({ error: 'Error al eliminar automatización' }, { status: 500 })
  }
}
