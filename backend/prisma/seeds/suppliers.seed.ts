import type { PrismaClient } from '../../src/generated/prisma/client.js'

async function seedSuppliers(prisma: PrismaClient, empresaId: string) {
  try {
    console.log('🌱 Starting suppliers seed...\n')

    // Proveedor 1: Autautopartes
    await prisma.supplier.upsert({
      where: {
        empresaId_code: {
          empresaId,
          code: 'AUT001',
        },
      },
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
      where: {
        empresaId_code: {
          empresaId,
          code: 'REP002',
        },
      },
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
      where: {
        empresaId_code: {
          empresaId,
          code: 'MER003',
        },
      },
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

    console.log('\n✅ Suppliers seed completed!\n')
  } catch (error) {
    console.error('❌ Error seeding suppliers:', error)
    throw error
  }
}

export default seedSuppliers
