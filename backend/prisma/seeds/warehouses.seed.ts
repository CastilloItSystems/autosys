import type { PrismaClient } from '../../src/generated/prisma/client.js'

async function seedWarehouses(prisma: PrismaClient, empresaId: string) {
  try {
    console.log('🌱 Starting warehouses seed...\n')

    // Almacén Principal
    await prisma.warehouse.upsert({
      where: {
        empresaId_code: {
          empresaId,
          code: 'PRINCIPAL',
        },
      },
      update: {
        name: 'Almacén Principal',
        type: 'PRINCIPAL',
        address: 'Centro de operaciones',
        isActive: true,
        empresaId,
      },
      create: {
        code: 'PRINCIPAL',
        name: 'Almacén Principal',
        type: 'PRINCIPAL',
        address: 'Centro de operaciones',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Warehouse upserted: Almacén Principal')

    // Obsolescencia 1
    await prisma.warehouse.upsert({
      where: {
        empresaId_code: {
          empresaId,
          code: 'OBS-1',
        },
      },
      update: {
        name: 'OBSOLECENCIA 1',
        type: 'SUCURSAL',
        address: 'Almacén de Obsolescencia 1',
        isActive: true,
        empresaId,
      },
      create: {
        code: 'OBS-1',
        name: 'OBSOLECENCIA 1',
        type: 'SUCURSAL',
        address: 'Almacén de Obsolescencia 1',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Warehouse upserted: OBSOLECENCIA 1')

    // Obsolescencia 2
    await prisma.warehouse.upsert({
      where: {
        empresaId_code: {
          empresaId,
          code: 'OBS-2',
        },
      },
      update: {
        name: 'OBSOLECENCIA 2',
        type: 'SUCURSAL',
        address: 'Almacén de Obsolescencia 2',
        isActive: true,
        empresaId,
      },
      create: {
        code: 'OBS-2',
        name: 'OBSOLECENCIA 2',
        type: 'SUCURSAL',
        address: 'Almacén de Obsolescencia 2',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Warehouse upserted: OBSOLECENCIA 2')

    // Obsolescencia 3
    await prisma.warehouse.upsert({
      where: {
        empresaId_code: {
          empresaId,
          code: 'OBS-3',
        },
      },
      update: {
        name: 'OBSOLECENCIA 3',
        type: 'SUCURSAL',
        address: 'Almacén de Obsolescencia 3',
        isActive: true,
        empresaId,
      },
      create: {
        code: 'OBS-3',
        name: 'OBSOLECENCIA 3',
        type: 'SUCURSAL',
        address: 'Almacén de Obsolescencia 3',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Warehouse upserted: OBSOLECENCIA 3')

    console.log('\n✅ All warehouses seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding warehouses:', error)
    throw error
  }
}

export default seedWarehouses
