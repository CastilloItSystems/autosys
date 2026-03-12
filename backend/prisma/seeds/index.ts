import 'dotenv/config'
import { PrismaClient } from '../../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

import seedEmpresas from './empresas.seed.js'
import seedCompanyRoles from './companyRoles.seed.js'
import seedUsers from './users.seed.js'
import seedMemberships from './memberships.seed.js'

import seedCategories from './categories.seed.js'
import seedUnits from './units.seed.js'
import seedBrands from './brands.seed.js'
import seedModels from './models.seed.js'
import seedWarehouses from './warehouses.seed.js'
import seedSuppliers from './suppliers.seed.js'
import seedItems from './items.seed.js'
import seedPermissions from './permissions.seed.js'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    console.log('🌱 Starting database seeding...\n')

    // Fase 1: Crear empresa
    const empresaId = await seedEmpresas(prisma)
    console.log('')

    // Fase 2: Crear permisos globales
    await seedPermissions(prisma)
    console.log('')

    // Fase 3: Crear roles por empresa + asignar permisos
    await seedCompanyRoles(prisma, empresaId)
    console.log('')

    // Fase 4: Catálogos por empresa
    await seedUnits(prisma, empresaId)
    console.log('')

    await seedBrands(prisma, empresaId)
    console.log('')

    await seedModels(prisma, empresaId)
    console.log('')

    await seedWarehouses(prisma, empresaId)
    console.log('')

    await seedCategories(prisma, empresaId)
    console.log('')

    // Fase 5: Proveedores
    await seedSuppliers(prisma, empresaId)
    console.log('')

    // Fase 6: Items
    await seedItems(prisma, empresaId)
    console.log('')

    // Fase 7: Usuarios globales
    await seedUsers(prisma)
    console.log('')

    // Fase 8: Memberships usuario-empresa-rol
    await seedMemberships(prisma, empresaId)
    console.log('')

    console.log('\n🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
