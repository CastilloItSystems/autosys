import type { PrismaClient } from '../../src/generated/prisma/client.js'

async function seedBrands(prisma: PrismaClient, empresaId: string) {
  try {
    console.log('🌱 Starting brands seed...\n')

    // Marcas de Vehículos
    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'TOY' } },
      update: { name: 'Toyota', type: 'VEHICLE', isActive: true },
      create: {
        code: 'TOY',
        name: 'Toyota',
        type: 'VEHICLE',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Toyota')

    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'CHV' } },
      update: { name: 'Chevrolet', type: 'VEHICLE', isActive: true },
      create: {
        code: 'CHV',
        name: 'Chevrolet',
        type: 'VEHICLE',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Chevrolet')

    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'FRD' } },
      update: { name: 'Ford', type: 'VEHICLE', isActive: true },
      create: {
        code: 'FRD',
        name: 'Ford',
        type: 'VEHICLE',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Ford')

    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'NIS' } },
      update: { name: 'Nissan', type: 'VEHICLE', isActive: true },
      create: {
        code: 'NIS',
        name: 'Nissan',
        type: 'VEHICLE',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Nissan')

    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'HYU' } },
      update: { name: 'Hyundai', type: 'VEHICLE', isActive: true },
      create: {
        code: 'HYU',
        name: 'Hyundai',
        type: 'VEHICLE',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Hyundai')

    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'KIA' } },
      update: { name: 'Kia', type: 'VEHICLE', isActive: true },
      create: {
        code: 'KIA',
        name: 'Kia',
        type: 'VEHICLE',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Kia')

    // Marcas de Repuestos
    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'BSH' } },
      update: { name: 'Bosch', type: 'PART', isActive: true },
      create: {
        code: 'BSH',
        name: 'Bosch',
        type: 'PART',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Bosch')

    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'MNF' } },
      update: { name: 'Mann Filter', type: 'PART', isActive: true },
      create: {
        code: 'MNF',
        name: 'Mann Filter',
        type: 'PART',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Mann Filter')

    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'CST' } },
      update: { name: 'Castrol', type: 'PART', isActive: true },
      create: {
        code: 'CST',
        name: 'Castrol',
        type: 'PART',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Castrol')

    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'ATE' } },
      update: { name: 'ATE', type: 'PART', isActive: true },
      create: {
        code: 'ATE',
        name: 'ATE',
        type: 'PART',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: ATE')

    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'BRB' } },
      update: { name: 'Brembo', type: 'PART', isActive: true },
      create: {
        code: 'BRB',
        name: 'Brembo',
        type: 'PART',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Brembo')

    await prisma.brand.upsert({
      where: { empresaId_code: { empresaId, code: 'VLO' } },
      update: { name: 'Valeo', type: 'PART', isActive: true },
      create: {
        code: 'VLO',
        name: 'Valeo',
        type: 'PART',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Brand upserted: Valeo')

    console.log('\n✅ All brands seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding brands:', error)
    throw error
  }
}

export default seedBrands
