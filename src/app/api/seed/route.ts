import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    // Check if already seeded
    const existingUser = await db.user.findUnique({ where: { email: 'demo@glossy.cl' } })
    if (existingUser) {
      return NextResponse.json({ message: 'Demo data already exists', email: 'demo@glossy.cl', password: 'demo123' })
    }

    const hashedPassword = await hashPassword('demo123')

    // Create owner user
    const owner = await db.user.create({
      data: {
        email: 'demo@glossy.cl',
        password: hashedPassword,
        name: 'Carolina Muñoz',
        role: 'owner',
        ownedSalon: {
          create: {
            name: 'Glossy Studio',
            address: 'Av. Providencia 1234, Santiago',
            phone: '+56 9 1234 5678',
            email: 'contacto@glossy.cl',
            openTime: '09:00',
            closeTime: '19:00',
            workDays: '1,2,3,4,5,6',
          },
        },
      },
      include: { ownedSalon: true },
    })

    const salonId = owner.ownedSalon!.id

    // Update owner with salonId for staff relation
    await db.user.update({
      where: { id: owner.id },
      data: { salonId },
    })

    // Create staff
    const staff1 = await db.user.create({
      data: {
        email: 'maria@glossy.cl',
        password: hashedPassword,
        name: 'María López',
        role: 'staff',
        salonId,
      },
    })

    const staff2 = await db.user.create({
      data: {
        email: 'sofia@glossy.cl',
        password: hashedPassword,
        name: 'Sofía Herrera',
        role: 'staff',
        salonId,
      },
    })

    // Create services
    const services = await Promise.all([
      db.service.create({ data: { name: 'Corte Mujer', duration: 45, price: 15000, category: 'Corte', salonId } }),
      db.service.create({ data: { name: 'Corte Hombre', duration: 30, price: 10000, category: 'Corte', salonId } }),
      db.service.create({ data: { name: 'Color Completo', duration: 120, price: 45000, category: 'Color', salonId } }),
      db.service.create({ data: { name: 'Mechas/Balayage', duration: 150, price: 55000, category: 'Color', salonId } }),
      db.service.create({ data: { name: 'Tinte Raíz', duration: 60, price: 25000, category: 'Color', salonId } }),
      db.service.create({ data: { name: 'Tratamiento Keratina', duration: 90, price: 35000, category: 'Tratamiento', salonId } }),
      db.service.create({ data: { name: 'Hidratación Profunda', duration: 45, price: 18000, category: 'Tratamiento', salonId } }),
      db.service.create({ data: { name: 'Peinado Evento', duration: 60, price: 25000, category: 'Peinado', salonId } }),
      db.service.create({ data: { name: 'Alisado Definitivo', duration: 180, price: 65000, category: 'Tratamiento', salonId } }),
      db.service.create({ data: { name: 'Corte + Peinado', duration: 60, price: 20000, category: 'Combo', salonId } }),
    ])

    // Create clients
    const clients = await Promise.all([
      db.client.create({ data: { firstName: 'Valentina', lastName: 'Rojas', email: 'valentina@email.cl', phone: '+56 9 1111 1111', status: 'recurring', source: 'referral', preferences: JSON.stringify({ stylist: 'María', avoidMornings: true }), salonId } }),
      db.client.create({ data: { firstName: 'Camila', lastName: 'Fernández', email: 'camila@email.cl', phone: '+56 9 2222 2222', status: 'recurring', source: 'social', preferences: JSON.stringify({ stylist: 'Sofía', prefersNatural: true }), salonId } }),
      db.client.create({ data: { firstName: 'Isabella', lastName: 'Morales', email: 'isabella@email.cl', phone: '+56 9 3333 3333', status: 'new', source: 'walk-in', salonId } }),
      db.client.create({ data: { firstName: 'Francisca', lastName: 'Torres', email: 'francisca@email.cl', phone: '+56 9 4444 4444', status: 'inactive', source: 'referral', salonId } }),
      db.client.create({ data: { firstName: 'Antonella', lastName: 'Gutiérrez', email: 'antonella@email.cl', phone: '+56 9 5555 5555', status: 'recurring', source: 'social', preferences: JSON.stringify({ stylist: 'María' }), salonId } }),
      db.client.create({ data: { firstName: 'Martina', lastName: 'Díaz', email: 'martina@email.cl', phone: '+56 9 6666 6666', status: 'new', source: 'walk-in', salonId } }),
      db.client.create({ data: { firstName: 'Lucía', lastName: 'Vargas', email: 'lucia@email.cl', phone: '+56 9 7777 7777', status: 'inactive', source: 'social', salonId } }),
      db.client.create({ data: { firstName: 'Paula', lastName: 'Castro', email: 'paula@email.cl', phone: '+56 9 8888 8888', status: 'recurring', source: 'referral', preferences: JSON.stringify({ prefersNatural: true, avoidChemicals: true }), salonId } }),
      db.client.create({ data: { firstName: 'Daniela', lastName: 'Soto', email: 'daniela@email.cl', phone: '+56 9 9999 9999', status: 'new', source: 'walk-in', salonId } }),
      db.client.create({ data: { firstName: 'Javiera', lastName: 'Muñoz', email: 'javiera@email.cl', phone: '+56 9 0000 0000', status: 'recurring', source: 'referral', preferences: JSON.stringify({ stylist: 'Sofía' }), salonId } }),
    ])

    // Create appointments (past and future)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const appointmentData = [
      // Past completed appointments
      { date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000), start: '10:00', end: '11:30', status: 'completed', client: 0, service: 2, staff: staff1.id },
      { date: new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000), start: '11:00', end: '12:00', status: 'completed', client: 1, service: 0, staff: staff2.id },
      { date: new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000), start: '14:00', end: '16:30', status: 'completed', client: 4, service: 3, staff: staff2.id },
      { date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), start: '09:00', end: '10:00', status: 'completed', client: 7, service: 6, staff: staff1.id },
      { date: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000), start: '15:00', end: '16:00', status: 'completed', client: 0, service: 0, staff: staff1.id },
      { date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000), start: '10:00', end: '11:00', status: 'completed', client: 1, service: 9, staff: staff2.id },
      { date: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000), start: '16:00', end: '17:30', status: 'completed', client: 9, service: 2, staff: staff1.id },
      { date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000), start: '11:00', end: '12:00', status: 'completed', client: 4, service: 1, staff: staff2.id },
      { date: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000), start: '14:00', end: '15:00', status: 'completed', client: 7, service: 0, staff: staff1.id },
      { date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), start: '09:30', end: '11:30', status: 'completed', client: 0, service: 3, staff: staff1.id },
      { date: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000), start: '15:00', end: '16:30', status: 'completed', client: 9, service: 5, staff: staff2.id },
      { date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), start: '10:00', end: '11:00', status: 'completed', client: 1, service: 6, staff: staff2.id },
      { date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), start: '14:00', end: '15:00', status: 'completed', client: 2, service: 9, staff: staff1.id },
      // Today's appointments
      { date: today, start: '09:00', end: '10:30', status: 'completed', client: 0, service: 2, staff: staff1.id },
      { date: today, start: '10:30', end: '11:30', status: 'confirmed', client: 5, service: 0, staff: staff1.id },
      { date: today, start: '12:00', end: '13:00', status: 'scheduled', client: 4, service: 9, staff: staff2.id },
      { date: today, start: '14:00', end: '15:00', status: 'scheduled', client: 8, service: 6, staff: staff1.id },
      { date: today, start: '16:00', end: '17:00', status: 'scheduled', client: 7, service: 7, staff: staff2.id },
      // Future appointments
      { date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), start: '10:00', end: '11:00', status: 'confirmed', client: 1, service: 0, staff: staff2.id },
      { date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), start: '14:00', end: '15:30', status: 'scheduled', client: 9, service: 5, staff: staff1.id },
      { date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), start: '09:00', end: '10:00', status: 'scheduled', client: 3, service: 1, staff: staff1.id },
      { date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), start: '11:00', end: '12:30', status: 'scheduled', client: 6, service: 4, staff: staff2.id },
      { date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), start: '15:00', end: '18:00', status: 'scheduled', client: 0, service: 8, staff: staff1.id },
    ]

    for (const apt of appointmentData) {
      const appointment = await db.appointment.create({
        data: {
          date: apt.date,
          startTime: apt.start,
          endTime: apt.end,
          status: apt.status,
          clientId: clients[apt.client].id,
          staffId: apt.staff,
          salonId,
          services: {
            create: { serviceId: services[apt.service].id },
          },
        },
      })
    }

    // Create client notes
    await Promise.all([
      db.clientNote.create({ data: { clientId: clients[0].id, content: 'Prefiere horarios de tarde. Alergia a productos con amoníaco.', type: 'preference' } }),
      db.clientNote.create({ data: { clientId: clients[0].id, content: 'Siempre trae a su hija, considerar paquete familiar.', type: 'general' } }),
      db.clientNote.create({ data: { clientId: clients[1].id, content: 'Le gusta el estilo natural, evitar cortes muy drásticos.', type: 'preference' } }),
      db.clientNote.create({ data: { clientId: clients[3].id, content: 'Última visita hace 45 días. Contactar para reactivar.', type: 'alert' } }),
      db.clientNote.create({ data: { clientId: clients[6].id, content: 'Se mudó de comuna, quizás necesite horarios diferentes.', type: 'general' } }),
      db.clientNote.create({ data: { clientId: clients[7].id, content: 'Solo productos naturales y orgánicos.', type: 'preference' } }),
    ])

    // Create automations
    await Promise.all([
      db.automation.create({
        data: {
          name: 'Recordatorio de cita 24h antes',
          type: 'reminder',
          active: true,
          config: JSON.stringify({ hoursBefore: 24, channel: 'whatsapp' }),
          salonId,
        },
      }),
      db.automation.create({
        data: {
          name: 'Recuperación de clientes inactivos',
          type: 'inactive_recovery',
          active: true,
          config: JSON.stringify({ daysInactive: 30, discountPercent: 15, channel: 'email' }),
          salonId,
        },
      }),
      db.automation.create({
        data: {
          name: 'Descuento de cumpleaños',
          type: 'birthday',
          active: true,
          config: JSON.stringify({ discountPercent: 20, daysBefore: 7 }),
          salonId,
        },
      }),
      db.automation.create({
        data: {
          name: 'Programa de fidelización 5ta visita',
          type: 'loyalty',
          active: true,
          config: JSON.stringify({ visitsRequired: 5, discountPercent: 25 }),
          salonId,
        },
      }),
    ])

    // Create some notifications
    await Promise.all([
      db.notification.create({
        data: { title: '¡Bienvenida a Glossy CRM!', message: 'Comienza a gestionar tu peluquería de forma inteligente.', type: 'success', userId: owner.id },
      }),
      db.notification.create({
        data: { title: 'Cliente inactiva detectada', message: 'Francisca Torres no visita el salón hace más de 30 días.', type: 'warning', userId: owner.id },
      }),
      db.notification.create({
        data: { title: 'Cita confirmada', message: 'Martina Díaz confirmó su cita para mañana a las 09:00.', type: 'info', userId: owner.id },
      }),
    ])

    return NextResponse.json({
      message: 'Demo data created successfully!',
      email: 'demo@glossy.cl',
      password: 'demo123',
      stats: {
        clients: clients.length,
        services: services.length,
        appointments: appointmentData.length,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Error al crear datos de demo' }, { status: 500 })
  }
}
