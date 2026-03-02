import type { PrismaClient } from '../../src/generated/prisma/client.js'

async function seedEmpresas(prisma: PrismaClient): Promise<string> {
  try {
    console.log('🌱 Starting empresas seed...\n')

    // Crear empresa de prueba principal
    const empresaDemo = await prisma.empresa.upsert({
      where: { id_empresa: 'empresa-demo-001' },
      update: {
        nombre: 'Empresa Demo',
        direccion: 'Calle Principal 123, Centro',
        telefonos: '+58-xxx-xxx-xxxx',
        fax: '+58-xxx-xxx-xxxx',
        numerorif: 'V-12345678',
        numeronit: 'NIT-0000000000',
        website: 'https://demo.empresa.com',
        email: 'info@demo.empresa.com',
        contacto: 'Admin Demo',
        predeter: true,
        soporte1: 'soporte@demo.empresa.com',
        soporte2: 'backup@demo.empresa.com',
        soporte3: undefined,
        licencia: 'DEMO-2026-001',
        eliminado: false,
      },
      create: {
        id_empresa: 'empresa-demo-001',
        nombre: 'Empresa Demo',
        direccion: 'Calle Principal 123, Centro',
        telefonos: '+58-xxx-xxx-xxxx',
        fax: '+58-xxx-xxx-xxxx',
        numerorif: 'V-12345678',
        numeronit: 'NIT-0000000000',
        website: 'https://demo.empresa.com',
        email: 'info@demo.empresa.com',
        contacto: 'Admin Demo',
        predeter: true,
        soporte1: 'soporte@demo.empresa.com',
        soporte2: 'backup@demo.empresa.com',
        licencia: 'DEMO-2026-001',
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
