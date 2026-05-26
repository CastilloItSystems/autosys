/**
 * Grants OWNER access to a user on an empresa.
 * Ensures roles exist for the empresa, then upserts Membership.
 *
 * Run:
 *   EMPRESA_ID=cmplnbw07008t01poea2jmsmc \
 *   USER_EMAIL=alfc@facilcloud.com \
 *   npx tsx prisma/seeds/grant-empresa-access.ts
 */
import prisma from '../../src/services/prisma.service.js'
import {
  ensurePermissionCatalog,
  seedDefaultRolesForEmpresa,
  seedDefaultNotificationPoliciesForEmpresa,
} from '../../src/services/empresa-setup.service.js'

async function main() {
  const empresaId = process.env.EMPRESA_ID
  const userEmail = process.env.USER_EMAIL
  const roleName = process.env.ROLE_NAME ?? 'OWNER'

  if (!empresaId || !userEmail) {
    throw new Error('EMPRESA_ID and USER_EMAIL env vars are required')
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id_empresa: empresaId },
    select: { id_empresa: true, nombre: true },
  })
  if (!empresa) throw new Error(`Empresa not found: ${empresaId}`)

  const user = await prisma.user.findUnique({
    where: { correo: userEmail },
    select: { id: true, correo: true },
  })
  if (!user) throw new Error(`User not found: ${userEmail}`)

  console.log(`🔄 Ensuring permission catalog...`)
  await ensurePermissionCatalog()

  console.log(`🔄 Seeding default roles for empresa: ${empresa.nombre}`)
  await seedDefaultRolesForEmpresa(empresaId)
  await seedDefaultNotificationPoliciesForEmpresa(empresaId)

  const role = await prisma.companyRole.findFirst({
    where: { empresaId, name: roleName },
    select: { id: true, name: true },
  })
  if (!role) throw new Error(`Role ${roleName} not found in empresa ${empresaId}`)

  const membership = await prisma.membership.upsert({
    where: { userId_empresaId: { userId: user.id, empresaId } },
    update: { roleId: role.id, status: 'active' as any },
    create: {
      userId: user.id,
      empresaId,
      roleId: role.id,
      status: 'active' as any,
    },
  })

  console.log(`✅ Membership ready: ${user.correo} -> ${role.name} @ ${empresa.nombre}`)
  console.log(`   membershipId=${membership.id}`)
}

main()
  .catch((err) => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
