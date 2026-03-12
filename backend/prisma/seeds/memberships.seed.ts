import type { PrismaClient } from '../../src/generated/prisma/client.js'

const USER_ROLE_ASSIGNMENTS = [
  { correo: 'owner@test.com', roleName: 'OWNER' },
  { correo: 'admin@test.com', roleName: 'ADMIN' },
  { correo: 'gerente@test.com', roleName: 'GERENTE' },
  { correo: 'vendedor@test.com', roleName: 'VENDEDOR' },
  { correo: 'almacenista@test.com', roleName: 'ALMACENISTA' },
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
