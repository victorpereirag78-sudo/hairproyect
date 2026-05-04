import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from './db'

const SESSION_COOKIE = 'glossy-crm-session'
const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hashSync(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compareSync(password, hash)
}

export async function createSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

export async function getSessionUser() {
  const userId = await getSession()
  if (!userId) return null

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      ownedSalon: { select: { id: true, name: true } },
      salon: { select: { id: true, name: true } },
    },
  })

  if (!user) return null

  const salon = user.ownedSalon || user.salon

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    salonId: salon?.id ?? null,
    salonName: salon?.name ?? null,
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
