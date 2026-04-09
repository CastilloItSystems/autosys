import type { PrismaClient } from '../../src/generated/prisma/client.js'

async function seedEmpresas(prisma: PrismaClient): Promise<string> {
  try {
    console.log('🌱 Starting empresas seed...\n')

    // Crear empresa principal (CAMABARCA)
    const empresaDemo = await prisma.empresa.upsert({
      where: { id_empresa: 'camabarca-001' },
      update: {
        nombre: 'CAMIONES Y MAQUINARIAS BARCELONA C.A. (CAMABARCA)',
        direccion:
          'AV ROMULO BETANCOURT. BARCELONA-CARACAS EDIF CAMABAR PISO PB LOCAL N/A SECTOR LA PONDEROSA. ENTRADA A LAS VILLAS OLIMPICAS BARCELONA ANZOATEGUI ZONA POSTAL 6001',
        telefonos: '0424.847.87.47',
        fax: '',
        numerorif: 'J308467260',
        numeronit: '',
        website: '',
        email: 'camabar.rep.serv.admon@gmail.com',
        contacto: 'CARLOS ANDRES PEREZ RODRIGUEZ',
        predeter: true,
        soporte1: 'camabar.rep.serv.admon@gmail.com',
        soporte2: '',
        soporte3: undefined,
        licencia: 'CAMABARCA-2026-001',
        eliminado: false,
      },
      create: {
        id_empresa: 'camabarca-001',
        nombre: 'CAMIONES Y MAQUINARIAS BARCELONA C.A. (CAMABARCA)',
        direccion:
          'AV ROMULO BETANCOURT. BARCELONA-CARACAS EDIF CAMABAR PISO PB LOCAL N/A SECTOR LA PONDEROSA. ENTRADA A LAS VILLAS OLIMPICAS BARCELONA ANZOATEGUI ZONA POSTAL 6001',
        telefonos: '0424.847.87.47',
        fax: '',
        numerorif: 'J308467260',
        numeronit: '',
        website: '',
        email: 'camabar.rep.serv.admon@gmail.com',
        contacto: 'CARLOS ANDRES PEREZ RODRIGUEZ',
        predeter: true,
        soporte1: 'camabar.rep.serv.admon@gmail.com',
        soporte2: '',
        licencia: 'CAMABARCA-2026-001',
        eliminado: false,
      },
    })

    console.log(`✅ Empresa created/updated: ${empresaDemo.nombre}`)
    console.log(`   ID: ${empresaDemo.id_empresa}`)
    console.log(`   RIF: ${empresaDemo.numerorif}`)
    console.log(`   Email: ${empresaDemo.email}`)

    console.log('\n✅ Empresas seeded successfully!')

    return empresaDemo.id_empresa
  } catch (error) {
    console.error('❌ Error seeding empresas:', error)
    throw error
  }
}

export default seedEmpresas
