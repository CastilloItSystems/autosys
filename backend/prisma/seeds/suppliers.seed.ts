import type { PrismaClient } from '../../src/generated/prisma/client.js'

async function seedSuppliers(prisma: PrismaClient, empresaId: string) {
  try {
    console.log('🌱 Starting suppliers seed...\n')

    // Proveedor 1: Autautopartes
    await prisma.supplier.upsert({
      where: { code: 'AUT001' },
      update: {
        name: 'Autautopartes',
        contactName: 'Carlos López',
        email: 'carlos@autautopartes.com',
        phone: '+58 212 123-4567',
        address: 'Av. Principal, Caracas, Venezuela',
        taxId: 'J-12345678-9',
        isActive: true,
        empresaId,
      },
      create: {
        code: 'AUT001',
        name: 'Autautopartes',
        contactName: 'Carlos López',
        email: 'carlos@autautopartes.com',
        phone: '+58 212 123-4567',
        address: 'Av. Principal, Caracas, Venezuela',
        taxId: 'J-12345678-9',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Supplier upserted: Autautopartes')

    // Proveedor 2: Repuestos Premium
    await prisma.supplier.upsert({
      where: { code: 'REP002' },
      update: {
        name: 'Repuestos Premium',
        contactName: 'María Rodríguez',
        email: 'maria@repuestospremium.com',
        phone: '+58 212 987-6543',
        address: 'Centro Comercial Automotriz, Maracaibo, Venezuela',
        taxId: 'J-98765432-1',
        isActive: true,
        empresaId,
      },
      create: {
        code: 'REP002',
        name: 'Repuestos Premium',
        contactName: 'María Rodríguez',
        email: 'maria@repuestospremium.com',
        phone: '+58 212 987-6543',
        address: 'Centro Comercial Automotriz, Maracaibo, Venezuela',
        taxId: 'J-98765432-1',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Supplier upserted: Repuestos Premium')

    // Proveedor 3: Mercado Automotriz
    await prisma.supplier.upsert({
      where: { code: 'MER003' },
      update: {
        name: 'Mercado Automotriz',
        contactName: 'Juan García',
        email: 'juan@mercadoauto.com',
        phone: '+58 414 555-1234',
        address: 'Zona Industrial, Valencia, Venezuela',
        taxId: 'J-11223344-5',
        isActive: true,
        empresaId,
      },
      create: {
        code: 'MER003',
        name: 'Mercado Automotriz',
        contactName: 'Juan García',
        email: 'juan@mercadoauto.com',
        phone: '+58 414 555-1234',
        address: 'Zona Industrial, Valencia, Venezuela',
        taxId: 'J-11223344-5',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Supplier upserted: Mercado Automotriz')

    // Proveedor 4: Bosch Venezuela
    await prisma.supplier.upsert({
      where: { code: 'BSH004' },
      update: {
        name: 'Bosch Venezuela',
        contactName: 'Pedro Hernández',
        email: 'pedroherrera@bosch.com.ve',
        phone: '+58 212 789-0123',
        address: 'Torre Bosch, Los Palos Grandes, Caracas, Venezuela',
        taxId: 'J-55667788-9',
        isActive: true,
        empresaId,
      },
      create: {
        code: 'BSH004',
        name: 'Bosch Venezuela',
        contactName: 'Pedro Hernández',
        email: 'pedroherrera@bosch.com.ve',
        phone: '+58 212 789-0123',
        address: 'Torre Bosch, Los Palos Grandes, Caracas, Venezuela',
        taxId: 'J-55667788-9',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Supplier upserted: Bosch Venezuela')

    // Proveedor 5: Lubricantes Castrol
    await prisma.supplier.upsert({
      where: { code: 'CAS005' },
      update: {
        name: 'Lubricantes Castrol',
        contactName: 'Ana Martínez',
        email: 'ana@castrol.com.ve',
        phone: '+58 261 234-5678',
        address: 'Parque Industrial, Maracaibo, Venezuela',
        taxId: 'J-99887766-5',
        isActive: true,
        empresaId,
      },
      create: {
        code: 'CAS005',
        name: 'Lubricantes Castrol',
        contactName: 'Ana Martínez',
        email: 'ana@castrol.com.ve',
        phone: '+58 261 234-5678',
        address: 'Parque Industrial, Maracaibo, Venezuela',
        taxId: 'J-99887766-5',
        isActive: true,
        empresaId,
      },
    })
    console.log('✅ Supplier upserted: Lubricantes Castrol')

    console.log('\n✅ Suppliers seed completed!\n')
  } catch (error) {
    console.error('❌ Error seeding suppliers:', error)
    throw error
  }
}

export default seedSuppliers
