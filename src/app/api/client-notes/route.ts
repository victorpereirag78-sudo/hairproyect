import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { clientId, content, type } = body

    if (!clientId || !content) {
      return NextResponse.json({ error: 'Cliente y contenido son requeridos' }, { status: 400 })
    }

    const note = await db.clientNote.create({
      data: {
        clientId,
        content,
        type: type || 'general',
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json({ error: 'Error al crear nota' }, { status: 500 })
  }
}
