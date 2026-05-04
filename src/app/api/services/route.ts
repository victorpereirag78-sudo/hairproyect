import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const services = await db.service.findMany({
      where: { salonId: user.salonId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, duration, price, category, active } = body

    if (!name || !duration || price === undefined) {
      return NextResponse.json({ error: 'Nombre, duración y precio son requeridos' }, { status: 400 })
    }

    const service = await db.service.create({
      data: {
        name,
        duration: Number(duration),
        price: Number(price),
        category: category || null,
        active: active !== undefined ? active : true,
        salonId: user.salonId,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 })
  }
}
