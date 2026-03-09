// backend/prisma/seeds/dynamicRoles.seed.ts
// Migración de datos: crea CompanyRole y UserEmpresaRole a partir de
// los roles estáticos (ROLE_PERMISSIONS) y las asignaciones actuales (User.rol + User.empresas).
// Seguro de re-ejecutar (usa upsert).

import 'dotenv/config'
import { PrismaClient } from '../../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { ROLE_PERMISSIONS } from '../../src/shared/constants/permissions.js'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 Iniciando migración de roles dinámicos...\n')

  // 1. Obtener todas las empresas
  const empresas = await prisma.empresa.findMany({
    where: { eliminado: false },
    select: { id_empresa: true, nombre: true },
  })

  console.log(`📦 Empresas encontradas: ${empresas.length}`)

  // 2. Para cada empresa, crear los roles base del ROLE_PERMISSIONS
  let rolesCreados = 0
  const roleMap: Record<string, Record<string, string>> = {} // { empresaId: { roleName: companyRoleId } }

  for (const empresa of empresas) {
    roleMap[empresa.id_empresa] = {}

    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const companyRole = await prisma.companyRole.upsert({
        where: {
          name_empresaId: {
            name: roleName,
            empresaId: empresa.id_empresa,
          },
        },
        create: {
          name: roleName,
          description: getRoleDescription(roleName),
          empresaId: empresa.id_empresa,
          permissions: permissions as string[],
          isSystem: true,
        },
        update: {
          permissions: permissions as string[],
          isSystem: true,
        },
      })

      roleMap[empresa.id_empresa][roleName] = companyRole.id
      rolesCreados++
    }

    console.log(`  ✅ Empresa "${empresa.nombre}": ${Object.keys(ROLE_PERMISSIONS).length} roles creados/actualizados`)
  }

  console.log(`\n📋 Total roles creados/actualizados: ${rolesCreados}`)

  // 3. Obtener todos los usuarios con sus empresas actuales y rol actual
  const users = await prisma.user.findMany({
    where: { eliminado: false },
    select: {
      id: true,
      nombre: true,
      rol: true,
      empresas: {
        select: { id_empresa: true, nombre: true },
      },
    },
  })

  console.log(`\n👤 Usuarios encontrados: ${users.length}`)

  // 4. Para cada usuario, crear UserEmpresaRole por cada empresa que tiene
  let asignacionesCreadas = 0
  let asignacionesSinRol = 0

  for (const user of users) {
    if (user.empresas.length === 0) {
      console.log(`  ⚠️  Usuario "${user.nombre}" (${user.rol}) no tiene empresas asignadas — omitido`)
      continue
    }

    for (const empresa of user.empresas) {
      // Buscar el CompanyRole que corresponde al rol actual del usuario en esa empresa
      const roleId = roleMap[empresa.id_empresa]?.[user.rol]

      if (!roleId) {
        console.log(`  ⚠️  No se encontró rol "${user.rol}" para empresa "${empresa.nombre}" — omitido`)
        asignacionesSinRol++
        continue
      }

      await prisma.userEmpresaRole.upsert({
        where: {
          userId_empresaId: {
            userId: user.id,
            empresaId: empresa.id_empresa,
          },
        },
        create: {
          userId: user.id,
          empresaId: empresa.id_empresa,
          roleId,
          assignedBy: null, // migración automática
        },
        update: {
          roleId,
        },
      })

      asignacionesCreadas++
    }
  }

  console.log(`\n🔗 Asignaciones usuario-empresa-rol creadas: ${asignacionesCreadas}`)
  if (asignacionesSinRol > 0) {
    console.log(`⚠️  Asignaciones omitidas (rol no encontrado): ${asignacionesSinRol}`)
  }

  console.log('\n✅ Migración de roles dinámicos completada exitosamente!')
}

function getRoleDescription(roleName: string): string {
  const descriptions: Record<string, string> = {
    SUPER_ADMIN: 'Acceso total al sistema. Todos los permisos.',
    ADMIN: 'Administrador de la empresa. Gestiona inventario, usuarios y configuración.',
    GERENTE: 'Gerente. Aprueba órdenes de compra y ventas, ve reportes.',
    VENDEDOR: 'Vendedor. Crea y gestiona ventas.',
    ALMACENISTA: 'Almacenista. Gestiona stock, recibe órdenes, despacha notas de salida.',
    MECANICO: 'Mecánico. Solo puede ver artículos, stock y notas de salida.',
    CAJERO: 'Cajero. Gestiona pagos e facturas.',
    CONTADOR: 'Contador. Acceso a reportes y facturas.',
    ASESOR: 'Asesor comercial. Ve artículos, stock y puede crear ventas.',
    VIEWER: 'Solo lectura. Ve inventario, artículos, stock y reportes.',
  }
  return descriptions[roleName] ?? `Rol: ${roleName}`
}

main()
  .catch((e) => {
    console.error('❌ Error en migración:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
