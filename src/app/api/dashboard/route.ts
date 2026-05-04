import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user?.salonId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const salonId = user.salonId
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Today's appointments
    const todayAppointments = await db.appointment.findMany({
      where: {
        salonId,
        date: { gte: todayStart, lte: todayEnd },
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        services: { include: { service: true } },
      },
      orderBy: { startTime: 'asc' },
    })

    // Revenue this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const completedThisMonth = await db.appointment.findMany({
      where: {
        salonId,
        status: 'completed',
        date: { gte: monthStart },
      },
      include: { services: { include: { service: true } } },
    })

    const monthRevenue = completedThisMonth.reduce(
      (sum, a) => sum + a.services.reduce((s, as) => s + as.service.price, 0),
      0
    )

    // Today's estimated revenue
    const todayRevenue = todayAppointments
      .filter(a => a.status === 'completed' || a.status === 'confirmed' || a.status === 'scheduled')
      .reduce(
        (sum, a) => sum + a.services.reduce((s, as) => s + as.service.price, 0),
        0
      )

    // Client stats
    const totalClients = await db.client.count({ where: { salonId } })
    const newClients = await db.client.count({
      where: { salonId, status: 'new' },
    })
    const recurringClients = await db.client.count({
      where: { salonId, status: 'recurring' },
    })
    const inactiveClients = await db.client.count({
      where: { salonId, status: 'inactive' },
    })

    // New clients this month
    const newClientsThisMonth = await db.client.count({
      where: {
        salonId,
        createdAt: { gte: monthStart },
      },
    })

    // Appointments stats
    const totalAppointments = await db.appointment.count({ where: { salonId } })
    const completedAppointments = await db.appointment.count({
      where: { salonId, status: 'completed' },
    })
    const cancelledAppointments = await db.appointment.count({
      where: { salonId, status: 'cancelled' },
    })
    const noShowAppointments = await db.appointment.count({
      where: { salonId, status: 'no_show' },
    })

    // Revenue by day (last 30 days)
    const dailyRevenue = await db.appointment.findMany({
      where: {
        salonId,
        status: 'completed',
        date: { gte: thirtyDaysAgo },
      },
      include: { services: { include: { service: true } } },
      orderBy: { date: 'asc' },
    })

    const revenueByDay: Record<string, number> = {}
    dailyRevenue.forEach((a) => {
      const day = new Date(a.date).toISOString().split('T')[0]
      const rev = a.services.reduce((s, as) => s + as.service.price, 0)
      revenueByDay[day] = (revenueByDay[day] || 0) + rev
    })

    // Appointments by day (last 7 days)
    const weeklyAppointments = await db.appointment.findMany({
      where: {
        salonId,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'asc' },
    })

    const appointmentsByDay: Record<string, number> = {}
    weeklyAppointments.forEach((a) => {
      const day = new Date(a.date).toISOString().split('T')[0]
      appointmentsByDay[day] = (appointmentsByDay[day] || 0) + 1
    })

    // Services popularity
    const allCompletedAppointments = await db.appointment.findMany({
      where: { salonId, status: 'completed' },
      include: { services: { include: { service: true } } },
    })

    const servicePopularity: Record<string, { name: string; count: number; revenue: number }> = {}
    allCompletedAppointments.forEach((a) => {
      a.services.forEach((as) => {
        if (!servicePopularity[as.serviceId]) {
          servicePopularity[as.serviceId] = {
            name: as.service.name,
            count: 0,
            revenue: 0,
          }
        }
        servicePopularity[as.serviceId].count++
        servicePopularity[as.serviceId].revenue += as.service.price
      })
    })

    // Smart alerts - inactive clients that should be contacted
    const inactiveClientsList = await db.client.findMany({
      where: { salonId, status: 'inactive' },
      include: {
        appointments: {
          where: { status: 'completed' },
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    })

    const smartAlerts = inactiveClientsList
      .filter((c) => {
        if (c.appointments.length === 0) return false
        const lastDate = new Date(c.appointments[0].date)
        const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince > 30
      })
      .map((c) => ({
        type: 'inactive_client',
        clientId: c.id,
        clientName: `${c.firstName} ${c.lastName}`,
        message: `${c.firstName} ${c.lastName} no visita el salón hace más de 30 días. ¡Es un buen momento para contactar!`,
      }))

    // Clients with upcoming appointments needing reminder
    const upcomingWithoutReminder = await db.appointment.findMany({
      where: {
        salonId,
        status: 'scheduled',
        reminderSent: false,
        date: { gte: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      },
      include: { client: true },
    })

    upcomingWithoutReminder.forEach((a) => {
      smartAlerts.push({
        type: 'reminder_needed',
        appointmentId: a.id,
        clientName: `${a.client.firstName} ${a.client.lastName}`,
        message: `Recordatorio pendiente para ${a.client.firstName} ${a.client.lastName} - cita mañana a las ${a.startTime}`,
      })
    })

    return NextResponse.json({
      todayAppointments,
      todayRevenue,
      monthRevenue,
      totalClients,
      newClients,
      recurringClients,
      inactiveClients,
      newClientsThisMonth,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      revenueByDay,
      appointmentsByDay,
      servicePopularity: Object.values(servicePopularity).sort((a, b) => b.count - a.count),
      smartAlerts,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 })
  }
}
