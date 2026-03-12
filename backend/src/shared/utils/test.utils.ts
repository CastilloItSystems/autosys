// backend/src/shared/utils/test.utils.ts

import { generateToken, JWTPayload } from '../../services/jwt.service.js'
import prisma from '../../services/prisma.service.js'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Obtiene un token de autenticación para pruebas.
 * Crea o reutiliza un usuario de prueba (admin@test.com).
 */
export async function getTestAuthToken(): Promise<string> {
  let user = await prisma.user.findUnique({
    where: { correo: 'admin@test.com' },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        nombre: 'Test Admin User',
        correo: 'admin@test.com',
        password: 'test-hashed-password',
        rol: 'SUPER_ADMIN',
        estado: 'activo',
        acceso: 'completo',
        eliminado: false,
      },
    })
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.correo,
    role: user.rol,
    access: user.acceso,
    permissions: ['*'], // Para pruebas, otorgamos todos los permisos
  }

  return generateToken(payload)
}

// ---------------------------------------------------------------------------
// Empresa
// ---------------------------------------------------------------------------

/**
 * Obtiene el ID de la empresa de prueba.
 * Crea o reutiliza una empresa con nombre 'Test Empresa'.
 * La empresa queda asociada al usuario admin@test.com.
 */
export async function getTestEmpresaId(): Promise<string> {
  // Buscar empresa de prueba existente
  let empresa = await prisma.empresa.findFirst({
    where: { nombre: 'Test Empresa', eliminado: false },
  })

  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        nombre: 'Test Empresa',
        eliminado: false,
      },
    })
  }

  return empresa.id_empresa
}

/**
 * Obtiene token + empresaId en una sola llamada.
 * Conveniente para beforeAll cuando el test necesita ambos.
 */
export async function getTestCredentials(): Promise<{
  authToken: string
  empresaId: string
}> {
  const [authToken, empresaId] = await Promise.all([
    getTestAuthToken(),
    getTestEmpresaId(),
  ])
  return { authToken, empresaId }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/**
 * Limpia el usuario de prueba de la base de datos.
 */
export async function cleanupTestData(): Promise<void> {
  await prisma.user
    .deleteMany({
      where: { correo: 'admin@test.com' },
    })
    .catch(() => {})
}

/**
 * Limpia la empresa de prueba y todos sus datos asociados.
 * Usar con cuidado — elimina en cascada warehouses, items, etc.
 */
export async function cleanupTestEmpresa(empresaId: string): Promise<void> {
  await prisma.empresa
    .deleteMany({
      where: { id_empresa: empresaId },
    })
    .catch(() => {})
}
