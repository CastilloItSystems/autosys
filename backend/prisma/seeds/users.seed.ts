import type { PrismaClient } from '../../src/generated/prisma/client.js'
import bcrypt from 'bcryptjs'

export default async function seedUsers(prisma: PrismaClient) {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10)
    const userPassword = await bcrypt.hash('user123', 10)

    const users = [
      {
        nombre: 'Owner User',
        correo: 'owner@test.com',
        password: adminPassword,
        estado: 'activo',
        departamento: ['administración', 'inventario', 'ventas'],
        acceso: 'completo',
      },
      {
        nombre: 'Admin User',
        correo: 'admin@test.com',
        password: adminPassword,
        estado: 'activo',
        departamento: ['administración', 'inventario'],
        acceso: 'completo',
      },
      {
        nombre: 'Gerente User',
        correo: 'gerente@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['ventas', 'inventario'],
        acceso: 'completo',
      },
      {
        nombre: 'Vendedor User',
        correo: 'vendedor@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['ventas'],
        acceso: 'limitado',
      },
      {
        nombre: 'Almacenista User',
        correo: 'almacenista@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['inventario'],
        acceso: 'limitado',
      },
      {
        nombre: 'Comprador User',
        correo: 'comprador@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['compras'],
        acceso: 'limitado',
      },
      {
        nombre: 'Jefe Compras User',
        correo: 'jefe.compras@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['compras', 'inventario'],
        acceso: 'completo',
      },
      {
        nombre: 'Administracion User',
        correo: 'administracion@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['finanzas'],
        acceso: 'completo',
      },
      {
        nombre: 'Cajero User',
        correo: 'cajero@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['finanzas', 'ventas'],
        acceso: 'limitado',
      },
      {
        nombre: 'Contador User',
        correo: 'contador@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['finanzas'],
        acceso: 'completo',
      },
      {
        nombre: 'Tecnico Taller User',
        correo: 'tecnico.taller@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['taller'],
        acceso: 'limitado',
      },
      {
        nombre: 'Jefe Taller User',
        correo: 'jefe.taller@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['taller', 'inventario'],
        acceso: 'completo',
      },
      {
        nombre: 'Asesor Servicio User',
        correo: 'asesor.servicio@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['taller', 'crm'],
        acceso: 'limitado',
      },
      {
        nombre: 'CRM Marketing User',
        correo: 'crm.marketing@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['crm', 'marketing'],
        acceso: 'limitado',
      },
      {
        nombre: 'Concesionario User',
        correo: 'concesionario@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: ['concesionario', 'crm'],
        acceso: 'limitado',
      },
      {
        nombre: 'Viewer User',
        correo: 'viewer@test.com',
        password: userPassword,
        estado: 'activo',
        departamento: [],
        acceso: 'ninguno',
      },
    ] as const

    for (const user of users) {
      const created = await prisma.user.upsert({
        where: { correo: user.correo },
        update: {
          nombre: user.nombre,
          password: user.password,
          estado: user.estado as any,
          departamento: [...user.departamento],
          acceso: user.acceso as any,
          eliminado: false,
        },
        create: {
          nombre: user.nombre,
          correo: user.correo,
          password: user.password,
          estado: user.estado as any,
          departamento: [...user.departamento],
          acceso: user.acceso as any,
          eliminado: false,
        },
      })

      console.log(`✅ User created: ${created.correo}`)
    }

    console.log('✅ All users seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding users:', error)
    throw error
  }
}
