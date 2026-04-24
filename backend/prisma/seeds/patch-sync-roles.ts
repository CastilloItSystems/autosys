/**
 * One-time patch: syncs permission catalog, re-seeds default roles,
 * and ensures default notification policies for ALL existing empresas.
 *
 * Run: npx tsx prisma/seeds/patch-sync-roles.ts
 */
import prisma from '../../src/services/prisma.service.js'
import {
  ensurePermissionCatalog,
  seedDefaultNotificationPoliciesForEmpresa,
  seedDefaultRolesForEmpresa,
} from '../../src/services/empresa-setup.service.js'

async function main() {
  console.log('🔄 Syncing permission catalog...')
  await ensurePermissionCatalog()
  console.log('✅ Permission catalog synced')

  const empresas = await prisma.empresa.findMany({
    where: { eliminado: false },
    select: { id_empresa: true, nombre: true },
  })

  console.log(`🏢 Found ${empresas.length} empresa(s)`)

  for (const empresa of empresas) {
    console.log(`  → Syncing roles/policies for: ${empresa.nombre} (${empresa.id_empresa})`)
    await seedDefaultRolesForEmpresa(empresa.id_empresa)
    await seedDefaultNotificationPoliciesForEmpresa(empresa.id_empresa)
    console.log(`  ✅ Done: ${empresa.nombre}`)
  }

  console.log('\n✅ All empresas synced successfully')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
