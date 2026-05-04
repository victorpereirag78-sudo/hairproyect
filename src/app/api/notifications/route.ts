import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Mark all as read
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark notifications read error:', error)
    return NextResponse.json({ error: 'Error al marcar notificaciones' }, { status: 500 })
  }
}
