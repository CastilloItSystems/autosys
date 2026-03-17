import type { PrismaClient } from '../../src/generated/prisma/client.js'

async function seedItems(prisma: PrismaClient, empresaId: string) {
  try {
    console.log('🌱 Starting items seed...\n')

    // Obtener las referencias necesarias
    const iveco = await prisma.brand.findFirst({
      where: { code: 'IVC', empresaId },
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

    if (!iveco || !filters || !oils || !unit) {
      throw new Error(
        'Required brands, categories, or units not found. Run seed-db first.'
      )
    }

    // Item 1: Filtro de Aire
    await prisma.item.upsert({
      where: { empresaId_sku: { empresaId, sku: 'FLT-AIR-001' } },
      update: {
        name: 'Filtro de Aire Iveco BA-2015',
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
        code: 'FLT-AIR-001',
        name: 'Filtro de Aire Iveco BA-2015',
        description: 'Filtro de aire de alta calidad para motores de gasolina',
        brandId: iveco.id,
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
    console.log('✅ Item upserted: Filtro de Aire Iveco BA-2015')

    // Item 2: Filtro de Aceite
    await prisma.item.upsert({
      where: { empresaId_sku: { empresaId, sku: 'FLT-OIL-001' } },
      update: {
        name: 'Filtro de Aceite Iveco OB-2016',
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
        code: 'FLT-OIL-001',
        name: 'Filtro de Aceite Iveco OB-2016',
        description: 'Filtro de aceite para cambios regulares',
        brandId: iveco.id,
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
    console.log('✅ Item upserted: Filtro de Aceite Iveco OB-2016')

    // Item 3: Aceite 10W40
    await prisma.item.upsert({
      where: { empresaId_sku: { empresaId, sku: 'OIL-10W40-001' } },
      update: {
        name: 'Aceite Iveco 10W40 1L',
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
        code: 'OIL-10W40-001',
        name: 'Aceite Iveco 10W40 1L',
        description: 'Aceite multigrado sintético 10W40 para motores gasolina',
        brandId: iveco.id,
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
    console.log('✅ Item upserted: Aceite Iveco 10W40 1L')

    // Item 4: Aceite 15W40
    await prisma.item.upsert({
      where: { empresaId_sku: { empresaId, sku: 'OIL-15W40-001' } },
      update: {
        name: 'Aceite Iveco 15W40 1L',
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
        code: 'OIL-15W40-001',
        name: 'Aceite Iveco 15W40 1L',
        description: 'Aceite multigrado 15W40 para motores diesel',
        brandId: iveco.id,
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
    console.log('✅ Item upserted: Aceite Iveco 15W40 1L')

    // Item 5: Filtro de Cabina
    await prisma.item.upsert({
      where: { empresaId_sku: { empresaId, sku: 'FLT-CAB-001' } },
      update: {
        name: 'Filtro de Cabina Iveco CF-2017',
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
        code: 'FLT-CAB-001',
        name: 'Filtro de Cabina Iveco CF-2017',
        description: 'Filtro de cabina con carbón activado',
        brandId: iveco.id,
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
    console.log('✅ Item upserted: Filtro de Cabina Iveco CF-2017')

    // Generate 50 additional items for pagination testing
    console.log('🌱 Generating 50 test items...')
    const brands = [iveco]
    const categories = [filters, oils]

    for (let i = 1; i <= 50; i++) {
      const brand = brands[i % brands.length]!
      const category = categories[i % categories.length]!
      const sku = `GEN-ITEM-${i.toString().padStart(3, '0')}`
      const code = sku
      const name = `Item Generico ${i} ${brand.name}`
      const price = (1000 + i * 50).toFixed(2)

      await prisma.item.upsert({
        where: { empresaId_sku: { empresaId, sku } },
        update: {
          name,
          description: `Descripción generada para el item ${i}`,
          salePrice: price,
          costPrice: (parseFloat(price) * 0.7).toFixed(2),
          minStock: 5,
          maxStock: 100,
          reorderPoint: 10,
          isActive: i % 10 !== 0, // Some items inactive
          empresaId,
        },
        create: {
          sku,
          code,
          name,
          description: `Descripción generada para el item ${i}`,
          brandId: brand.id,
          categoryId: category.id,
          unitId: unit.id,
          salePrice: price,
          costPrice: (parseFloat(price) * 0.7).toFixed(2),
          minStock: 5,
          maxStock: 100,
          reorderPoint: 10,
          isActive: i % 10 !== 0,
          empresaId,
          tags: ['generico', 'test', brand.name.toLowerCase()],
        },
      })
    }
    console.log('✅ 50 test items generated')

    console.log('\n✅ Items seed completed!\n')
  } catch (error) {
    console.error('❌ Error seeding items:', error)
    throw error
  }
}

export default seedItems
