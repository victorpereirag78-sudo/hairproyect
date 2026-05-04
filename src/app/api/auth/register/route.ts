import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, salonName } = body

    if (!email || !password || !name || !salonName) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'owner',
        ownedSalon: {
          create: {
            name: salonName,
          },
        },
      },
      include: {
        ownedSalon: true,
        salon: true,
      },
    })

    await createSession(user.id)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      salonId: user.ownedSalon?.id ?? user.salon?.id ?? null,
      salonName: user.ownedSalon?.name ?? user.salon?.name ?? null,
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Error al crear la cuenta' },
      { status: 500 }
    )
  }
}
