import type { PrismaClient } from '../../src/generated/prisma/client.js'

const USER_ROLE_ASSIGNMENTS = [
  { correo: 'owner@test.com', roleName: 'OWNER' },
  { correo: 'admin@test.com', roleName: 'ADMIN' },
  { correo: 'gerente@test.com', roleName: 'GERENTE' },
  { correo: 'vendedor@test.com', roleName: 'VENDEDOR' },
  { correo: 'almacenista@test.com', roleName: 'ALMACENISTA' },
  { correo: 'comprador@test.com', roleName: 'COMPRADOR' },
  { correo: 'jefe.compras@test.com', roleName: 'JEFE_COMPRAS' },
  { correo: 'administracion@test.com', roleName: 'ADMINISTRACION' },
  { correo: 'cajero@test.com', roleName: 'CAJERO' },
  { correo: 'contador@test.com', roleName: 'CONTADOR' },
  { correo: 'tecnico.taller@test.com', roleName: 'TECNICO_TALLER' },
  { correo: 'jefe.taller@test.com', roleName: 'JEFE_TALLER' },
  { correo: 'asesor.servicio@test.com', roleName: 'ASESOR_SERVICIO' },
  { correo: 'crm.marketing@test.com', roleName: 'CRM_MARKETING' },
  { correo: 'concesionario@test.com', roleName: 'CONCESIONARIO' },
  { correo: 'viewer@test.com', roleName: 'VIEWER' },
]

export default async function seedMemberships(
  prisma: PrismaClient,
  empresaId: string
) {
  try {
    for (const assignment of USER_ROLE_ASSIGNMENTS) {
      const user = await prisma.user.findUnique({
        where: { correo: assignment.correo },
      })

      if (!user) {
        console.warn(`⚠️ User not found: ${assignment.correo}`)
        continue
      }

      const role = await prisma.companyRole.findFirst({
        where: {
          empresaId,
          name: assignment.roleName,
        },
      })

      if (!role) {
        console.warn(`⚠️ Role not found: ${assignment.roleName}`)
        continue
      }

      await prisma.membership.upsert({
        where: {
          userId_empresaId: {
            userId: user.id,
            empresaId,
          },
        },
        update: {
          roleId: role.id,
          status: 'active' as any,
        },
        create: {
          userId: user.id,
          empresaId,
          roleId: role.id,
          status: 'active' as any,
        },
      })

      console.log(
        `✅ Membership created: ${assignment.correo} -> ${assignment.roleName}`
      )
    }

    console.log('✅ Memberships seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding memberships:', error)
    throw error
  }
}
