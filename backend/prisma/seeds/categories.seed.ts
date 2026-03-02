import type { PrismaClient } from '../../src/generated/prisma/client.js'

async function seedCategories(prisma: PrismaClient, empresaId: string) {
  try {
    console.log('🌱 Starting categories seed...\n')

    // ============================================
    // CATEGORÍAS RAÍZ (nivel 1)
    // ============================================

    // Filtros
    const filters = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'FILT' } },
      update: {
        name: 'Filtros',
        defaultMargin: 30.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'FILT',
        name: 'Filtros',
        defaultMargin: 30.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Category upserted: ${filters.name}`)

    // Aceites y Lubricantes
    const oils = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'ACEITE' } },
      update: {
        name: 'Aceites y Lubricantes',
        defaultMargin: 25.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'ACEITE',
        name: 'Aceites y Lubricantes',
        defaultMargin: 25.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Category upserted: ${oils.name}`)

    // Frenos
    const brakes = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'FRENO' } },
      update: {
        name: 'Frenos',
        defaultMargin: 35.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'FRENO',
        name: 'Frenos',
        defaultMargin: 35.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Category upserted: ${brakes.name}`)

    // Sistema Eléctrico
    const electrical = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'ELEC' } },
      update: {
        name: 'Sistema Eléctrico',
        defaultMargin: 28.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'ELEC',
        name: 'Sistema Eléctrico',
        defaultMargin: 28.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Category upserted: ${electrical.name}`)

    // Suspensión
    const suspension = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'SUSP' } },
      update: {
        name: 'Suspensión',
        defaultMargin: 32.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'SUSP',
        name: 'Suspensión',
        defaultMargin: 32.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Category upserted: ${suspension.name}`)

    // Transmisión
    const transmission = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'TRANS' } },
      update: {
        name: 'Transmisión',
        defaultMargin: 36.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'TRANS',
        name: 'Transmisión',
        defaultMargin: 36.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Category upserted: ${transmission.name}`)

    // Refrigeración
    const cooling = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'REFRIG' } },
      update: {
        name: 'Refrigeración',
        defaultMargin: 27.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'REFRIG',
        name: 'Refrigeración',
        defaultMargin: 27.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Category upserted: ${cooling.name}`)

    // Combustible
    const fuel = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'COMB' } },
      update: {
        name: 'Combustible',
        defaultMargin: 20.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'COMB',
        name: 'Combustible',
        defaultMargin: 20.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Category upserted: ${fuel.name}`)

    // Herramientas
    const tools = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'HERR' } },
      update: {
        name: 'Herramientas',
        defaultMargin: 40.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'HERR',
        name: 'Herramientas',
        defaultMargin: 40.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Category upserted: ${tools.name}`)

    // ============================================
    // SUBCATEGORÍAS (nivel 2) - FILTROS
    // ============================================

    const filtroAceite = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'FILT_ACE' } },
      update: {
        name: 'Filtros de Aceite',
        parentId: filters.id,
        defaultMargin: 28.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'FILT_ACE',
        name: 'Filtros de Aceite',
        parentId: filters.id,
        defaultMargin: 28.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${filtroAceite.name}`)

    const filtroAire = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'FILT_AIRE' } },
      update: {
        name: 'Filtros de Aire',
        parentId: filters.id,
        defaultMargin: 32.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'FILT_AIRE',
        name: 'Filtros de Aire',
        parentId: filters.id,
        defaultMargin: 32.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${filtroAire.name}`)

    const filtroCombustible = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'FILT_COMB' } },
      update: {
        name: 'Filtros de Combustible',
        parentId: filters.id,
        defaultMargin: 30.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'FILT_COMB',
        name: 'Filtros de Combustible',
        parentId: filters.id,
        defaultMargin: 30.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${filtroCombustible.name}`)

    // ============================================
    // SUBCATEGORÍAS (nivel 2) - FRENOS
    // ============================================

    const pastillas = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'FRENO_PAST' } },
      update: {
        name: 'Pastillas de Freno',
        parentId: brakes.id,
        defaultMargin: 38.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'FRENO_PAST',
        name: 'Pastillas de Freno',
        parentId: brakes.id,
        defaultMargin: 38.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${pastillas.name}`)

    const discos = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'FRENO_DISC' } },
      update: {
        name: 'Discos de Freno',
        parentId: brakes.id,
        defaultMargin: 35.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'FRENO_DISC',
        name: 'Discos de Freno',
        parentId: brakes.id,
        defaultMargin: 35.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${discos.name}`)

    const fluido = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'FRENO_FLUID' } },
      update: {
        name: 'Fluido de Freno',
        parentId: brakes.id,
        defaultMargin: 22.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'FRENO_FLUID',
        name: 'Fluido de Freno',
        parentId: brakes.id,
        defaultMargin: 22.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${fluido.name}`)

    // ============================================
    // SUBCATEGORÍAS (nivel 2) - ACEITES
    // ============================================

    const aceiteMotor = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'ACE_MOTOR' } },
      update: {
        name: 'Aceite de Motor',
        parentId: oils.id,
        defaultMargin: 24.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'ACE_MOTOR',
        name: 'Aceite de Motor',
        parentId: oils.id,
        defaultMargin: 24.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${aceiteMotor.name}`)

    const aceiteCaja = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'ACE_CAJA' } },
      update: {
        name: 'Aceite de Caja',
        parentId: oils.id,
        defaultMargin: 26.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'ACE_CAJA',
        name: 'Aceite de Caja',
        parentId: oils.id,
        defaultMargin: 26.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${aceiteCaja.name}`)

    const aceiteHidraulico = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'ACE_HIDRA' } },
      update: {
        name: 'Aceite Hidráulico',
        parentId: oils.id,
        defaultMargin: 27.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'ACE_HIDRA',
        name: 'Aceite Hidráulico',
        parentId: oils.id,
        defaultMargin: 27.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${aceiteHidraulico.name}`)

    // ============================================
    // SUBCATEGORÍAS (nivel 2) - SISTEMA ELÉCTRICO
    // ============================================

    const baterias = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'ELEC_BAT' } },
      update: {
        name: 'Baterías',
        parentId: electrical.id,
        defaultMargin: 32.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'ELEC_BAT',
        name: 'Baterías',
        parentId: electrical.id,
        defaultMargin: 32.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${baterias.name}`)

    const alternadores = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'ELEC_ALT' } },
      update: {
        name: 'Alternadores',
        parentId: electrical.id,
        defaultMargin: 28.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'ELEC_ALT',
        name: 'Alternadores',
        parentId: electrical.id,
        defaultMargin: 28.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${alternadores.name}`)

    const bujias = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'ELEC_BUJ' } },
      update: {
        name: 'Bujías',
        parentId: electrical.id,
        defaultMargin: 35.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'ELEC_BUJ',
        name: 'Bujías',
        parentId: electrical.id,
        defaultMargin: 35.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${bujias.name}`)

    // ============================================
    // SUBCATEGORÍAS (nivel 2) - SUSPENSIÓN
    // ============================================

    const amortiguadores = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'SUSP_AMOR' } },
      update: {
        name: 'Amortiguadores',
        parentId: suspension.id,
        defaultMargin: 34.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'SUSP_AMOR',
        name: 'Amortiguadores',
        parentId: suspension.id,
        defaultMargin: 34.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${amortiguadores.name}`)

    const espirales = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'SUSP_ESPI' } },
      update: {
        name: 'Espirales',
        parentId: suspension.id,
        defaultMargin: 32.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'SUSP_ESPI',
        name: 'Espirales',
        parentId: suspension.id,
        defaultMargin: 32.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${espirales.name}`)

    // ============================================
    // SUBCATEGORÍAS (nivel 2) - TRANSMISIÓN
    // ============================================

    const embrague = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'TRANS_EMBR' } },
      update: {
        name: 'Embrague',
        parentId: transmission.id,
        defaultMargin: 36.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'TRANS_EMBR',
        name: 'Embrague',
        parentId: transmission.id,
        defaultMargin: 36.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${embrague.name}`)

    // ============================================
    // SUBCATEGORÍAS (nivel 2) - REFRIGERACIÓN
    // ============================================

    const termostatos = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'REFRIG_TERM' } },
      update: {
        name: 'Termostatos',
        parentId: cooling.id,
        defaultMargin: 26.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'REFRIG_TERM',
        name: 'Termostatos',
        parentId: cooling.id,
        defaultMargin: 26.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${termostatos.name}`)

    const mangueras = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'REFRIG_MANG' } },
      update: {
        name: 'Mangueras',
        parentId: cooling.id,
        defaultMargin: 28.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'REFRIG_MANG',
        name: 'Mangueras',
        parentId: cooling.id,
        defaultMargin: 28.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${mangueras.name}`)

    // ============================================
    // SUBCATEGORÍAS (nivel 2) - HERRAMIENTAS
    // ============================================

    const destornilladores = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'HERR_DEST' } },
      update: {
        name: 'Destornilladores',
        parentId: tools.id,
        defaultMargin: 38.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'HERR_DEST',
        name: 'Destornilladores',
        parentId: tools.id,
        defaultMargin: 38.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${destornilladores.name}`)

    const llaves = await prisma.category.upsert({
      where: { empresaId_code: { empresaId, code: 'HERR_LLAVE' } },
      update: {
        name: 'Llaves y Alicates',
        parentId: tools.id,
        defaultMargin: 42.0,
        isActive: true,
        empresaId,
      },
      create: {
        code: 'HERR_LLAVE',
        name: 'Llaves y Alicates',
        parentId: tools.id,
        defaultMargin: 42.0,
        isActive: true,
        empresaId,
      },
    })
    console.log(`✅ Subcategory upserted: ${llaves.name}`)

    console.log('\n✅ All test categories seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  }
}

export default seedCategories
