import type { PrismaClient } from '../../src/generated/prisma/client.js'

async function seedModels(prisma: PrismaClient, empresaId: string) {
  try {
    console.log('🌱 Starting models seed...\n')

    // 1. Buscamos las marcas existentes para obtener sus IDs
    const brandCodes = ['TOY', 'CHV', 'FRD', 'NIS', 'HYU', 'KIA', 'BSH']
    const brands = await prisma.brand.findMany({
      where: {
        empresaId,
        code: { in: brandCodes },
      },
    })

    // Mapa para buscar ID de marca por su código
    const brandMap = new Map(brands.map((b) => [b.code, b.id]))

    // 2. Definimos los modelos a sembrar
    const models = [
      // Toyota (Vehículos)
      { brandCode: 'TOY', code: 'TOY-COR', name: 'Corolla', year: 2024, type: 'VEHICLE' },
      { brandCode: 'TOY', code: 'TOY-HIL', name: 'Hilux', year: 2024, type: 'VEHICLE' },
      { brandCode: 'TOY', code: 'TOY-YAR', name: 'Yaris', year: 2024, type: 'VEHICLE' },
      { brandCode: 'TOY', code: 'TOY-FOR', name: 'Fortuner', type: 'VEHICLE' }, // Sin año específico (aplica a varios)

      // Chevrolet (Vehículos)
      { brandCode: 'CHV', code: 'CHV-AVE', name: 'Aveo', year: 2024, type: 'VEHICLE' },
      { brandCode: 'CHV', code: 'CHV-SIL', name: 'Silverado', year: 2024, type: 'VEHICLE' },
      { brandCode: 'CHV', code: 'CHV-TAH', name: 'Tahoe', year: 2024, type: 'VEHICLE' },

      // Ford (Vehículos)
      { brandCode: 'FRD', code: 'FRD-F15', name: 'F-150', year: 2024, type: 'VEHICLE' },
      { brandCode: 'FRD', code: 'FRD-EXP', name: 'Explorer', year: 2024, type: 'VEHICLE' },
      { brandCode: 'FRD', code: 'FRD-FIE', name: 'Fiesta', year: 2020, type: 'VEHICLE' },

      // Nissan (Vehículos)
      { brandCode: 'NIS', code: 'NIS-SEN', name: 'Sentra', year: 2024, type: 'VEHICLE' },
      { brandCode: 'NIS', code: 'NIS-FRO', name: 'Frontier', year: 2024, type: 'VEHICLE' },

      // Bosch (Repuestos)
      { brandCode: 'BSH', code: 'BSH-SPK', name: 'Bujía Iridium', type: 'PART', specifications: { material: 'Iridium', gap: '1.1mm' } },
      { brandCode: 'BSH', code: 'BSH-OIL', name: 'Filtro de Aceite Premium', type: 'PART', specifications: { type: 'Spin-on', thread: 'M20x1.5' } },
    ]

    // 3. Insertar o actualizar modelos
    for (const model of models) {
      const brandId = brandMap.get(model.brandCode)

      if (!brandId) {
        console.warn(`⚠️ Marca no encontrada: ${model.brandCode}. Saltando modelo ${model.name}.`)
        continue
      }

      // Buscamos si ya existe (porque upsert falla con unique nullable)
      const existing = await prisma.model.findFirst({
        where: {
          empresaId,
          brandId,
          code: model.code,
          name: model.name,
          year: model.year ?? null,
          type: model.type as any,
        },
      })

      if (existing) {
        await prisma.model.update({
          where: { id: existing.id },
          data: {
            description: model.specifications ? `Repuesto ${model.name}` : `Vehículo ${model.name} ${model.year || ''}`,
            specifications: model.specifications ?? undefined,
            isActive: true,
          },
        })
      } else {
        await prisma.model.create({
          data: {
            empresaId,
            brandId,
            code: model.code,
            name: model.name,
            year: model.year ?? null,
            type: model.type as any,
            description: model.specifications ? `Repuesto ${model.name}` : `Vehículo ${model.name} ${model.year || ''}`,
            specifications: model.specifications ?? undefined,
            isActive: true,
          },
        })
      }
      console.log(`✅ Model upserted: ${model.brandCode} ${model.name}`)
    }

    console.log('\n✅ Models seed completed!')
  } catch (error) {
    console.error('❌ Error seeding models:', error)
    throw error
  }
}

export default seedModels
