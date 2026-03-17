import type { PrismaClient } from '../../src/generated/prisma/client.js'

async function seedBrands(prisma: PrismaClient, empresaId: string) {
  try {
    console.log('🌱 Starting brands seed...\n')

    // Marcas de Vehículos
    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'IVC' } },
      update: { name: 'Iveco', type: 'VEHICLE', isActive: true },
      create: {
        code: 'IVC',
        name: 'Iveco',
        type: 'BOTH',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Iveco')

    console.log('\n✅ All brands seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding brands:', error)
    throw error
  }
}

export default seedBrands
