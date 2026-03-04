import type { PrismaClient } from '../../src/generated/prisma/client.js'

async function seedItems(prisma: PrismaClient, empresaId: string) {
  try {
    console.log('🌱 Starting items seed...\n')

    // Obtener las referencias necesarias
    const bosch = await prisma.brand.findFirst({
      where: { code: 'BSH', empresaId },
    })
    const castrol = await prisma.brand.findFirst({
      where: { code: 'CST', empresaId },
    })
    const filters = await prisma.category.findFirst({
      where: { code: 'FILT', empresaId },
    })
    const oils = await prisma.category.findFirst({
      where: { code: 'ACEITE', empresaId },
    })
    const unit = await prisma.unit.findFirst({
      where: { code: 'UND', empresaId },
    })

    if (!bosch || !castrol || !filters || !oils || !unit) {
      throw new Error(
        'Required brands, categories, or units not found. Run seed-db first.'
      )
    }

    // Item 1: Filtro de Aire
    await prisma.item.upsert({
      where: { sku: 'FLT-AIR-001' },
      update: {
        name: 'Filtro de Aire Bosch BA-2015',
        description: 'Filtro de aire de alta calidad para motores de gasolina',
        salePrice: '4500.00',
        costPrice: '3000.00',
        minStock: 10,
        maxStock: 50,
        reorderPoint: 15,
        isActive: true,
        empresaId,
      },
      create: {
        sku: 'FLT-AIR-001',
        name: 'Filtro de Aire Bosch BA-2015',
        description: 'Filtro de aire de alta calidad para motores de gasolina',
        brandId: bosch.id,
        categoryId: filters.id,
        unitId: unit.id,
        salePrice: '4500.00',
        costPrice: '3000.00',
        minStock: 10,
        maxStock: 50,
        reorderPoint: 15,
        isActive: true,
        empresaId,
        tags: ['filtro', 'aire', 'motor'],
      },
    })
    console.log('✅ Item upserted: Filtro de Aire Bosch BA-2015')

    // Item 2: Filtro de Aceite
    await prisma.item.upsert({
      where: { sku: 'FLT-OIL-001' },
      update: {
        name: 'Filtro de Aceite Bosch OB-2016',
        description: 'Filtro de aceite para cambios regulares',
        salePrice: '3500.00',
        costPrice: '2200.00',
        minStock: 15,
        maxStock: 60,
        reorderPoint: 20,
        isActive: true,
        empresaId,
      },
      create: {
        sku: 'FLT-OIL-001',
        name: 'Filtro de Aceite Bosch OB-2016',
        description: 'Filtro de aceite para cambios regulares',
        brandId: bosch.id,
        categoryId: filters.id,
        unitId: unit.id,
        salePrice: '3500.00',
        costPrice: '2200.00',
        minStock: 15,
        maxStock: 60,
        reorderPoint: 20,
        isActive: true,
        empresaId,
        tags: ['filtro', 'aceite', 'cambio'],
      },
    })
    console.log('✅ Item upserted: Filtro de Aceite Bosch OB-2016')

    // Item 3: Aceite 10W40
    await prisma.item.upsert({
      where: { sku: 'OIL-10W40-001' },
      update: {
        name: 'Aceite Castrol 10W40 1L',
        description: 'Aceite multigrado sintético 10W40 para motores gasolina',
        salePrice: '2800.00',
        costPrice: '1800.00',
        minStock: 20,
        maxStock: 100,
        reorderPoint: 30,
        isActive: true,
        empresaId,
      },
      create: {
        sku: 'OIL-10W40-001',
        name: 'Aceite Castrol 10W40 1L',
        description: 'Aceite multigrado sintético 10W40 para motores gasolina',
        brandId: castrol.id,
        categoryId: oils.id,
        unitId: unit.id,
        salePrice: '2800.00',
        costPrice: '1800.00',
        minStock: 20,
        maxStock: 100,
        reorderPoint: 30,
        isActive: true,
        empresaId,
        tags: ['aceite', 'motor', 'lubricante', '10w40'],
      },
    })
    console.log('✅ Item upserted: Aceite Castrol 10W40 1L')

    // Item 4: Aceite 15W40
    await prisma.item.upsert({
      where: { sku: 'OIL-15W40-001' },
      update: {
        name: 'Aceite Castrol 15W40 1L',
        description: 'Aceite multigrado 15W40 para motores diesel',
        salePrice: '3000.00',
        costPrice: '1900.00',
        minStock: 15,
        maxStock: 80,
        reorderPoint: 25,
        isActive: true,
        empresaId,
      },
      create: {
        sku: 'OIL-15W40-001',
        name: 'Aceite Castrol 15W40 1L',
        description: 'Aceite multigrado 15W40 para motores diesel',
        brandId: castrol.id,
        categoryId: oils.id,
        unitId: unit.id,
        salePrice: '3000.00',
        costPrice: '1900.00',
        minStock: 15,
        maxStock: 80,
        reorderPoint: 25,
        isActive: true,
        empresaId,
        tags: ['aceite', 'diesel', 'lubricante', '15w40'],
      },
    })
    console.log('✅ Item upserted: Aceite Castrol 15W40 1L')

    // Item 5: Filtro de Cabina
    await prisma.item.upsert({
      where: { sku: 'FLT-CAB-001' },
      update: {
        name: 'Filtro de Cabina Bosch CF-2017',
        description: 'Filtro de cabina con carbón activado',
        salePrice: '5500.00',
        costPrice: '3500.00',
        minStock: 8,
        maxStock: 40,
        reorderPoint: 12,
        isActive: true,
        empresaId,
      },
      create: {
        sku: 'FLT-CAB-001',
        name: 'Filtro de Cabina Bosch CF-2017',
        description: 'Filtro de cabina con carbón activado',
        brandId: bosch.id,
        categoryId: filters.id,
        unitId: unit.id,
        salePrice: '5500.00',
        costPrice: '3500.00',
        minStock: 8,
        maxStock: 40,
        reorderPoint: 12,
        isActive: true,
        empresaId,
        tags: ['filtro', 'cabina', 'aire'],
      },
    })
    console.log('✅ Item upserted: Filtro de Cabina Bosch CF-2017')

    console.log('\n✅ Items seed completed!\n')
  } catch (error) {
    console.error('❌ Error seeding items:', error)
    throw error
  }
}

export default seedItems
