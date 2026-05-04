import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const automations = await db.automation.findMany({
      where: { salonId: user.salonId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      automations.map((a) => ({
        ...a,
        config: a.config ? JSON.parse(a.config) : {},
      }))
    )
  } catch (error) {
    console.error('Get automations error:', error)
    return NextResponse.json({ error: 'Error al obtener automatizaciones' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, type, active, config } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Nombre y tipo son requeridos' }, { status: 400 })
    }

    const automation = await db.automation.create({
      data: {
        name,
        type,
        active: active !== undefined ? active : true,
        config: config ? JSON.stringify(config) : '{}',
        salonId: user.salonId,
      },
    })

    return NextResponse.json({
      ...automation,
      config: JSON.parse(automation.config),
    }, { status: 201 })
  } catch (error) {
    console.error('Create automation error:', error)
    return NextResponse.json({ error: 'Error al crear automatización' }, { status: 500 })
  }
}
