import { generateToken, JWTPayload } from '../../services/jwt.service'
import prisma from '../../services/prisma.service'

/**
 * Obtiene un token de autenticación para pruebas
 * Crea o reutiliza un usuario de prueba (admin@test.com)
 * @returns Token JWT válido para usar en tests
 */
export async function getTestAuthToken(): Promise<string> {
  try {
    // Intentar obtener el usuario admin de prueba creado por el seed
    let user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })

    // Si no existe, crear un usuario de prueba
    if (!user) {
      user = await prisma.user.create({
        data: {
          nombre: 'Test Admin User',
          correo: 'admin@test.com',
          password: 'test-hashed-password', // Esto debería ser hashed en producción
          rol: 'SUPER_ADMIN',
          estado: 'activo',
          acceso: 'completo',
          eliminado: false,
        },
      })
    }

    // Generar y retornar token JWT
    const payload: JWTPayload = {
      userId: user.id,
      email: user.correo,
      role: user.rol,
      access: user.acceso,
    }

    return generateToken(payload)
  } catch (error) {
    console.error('Error obteniendo token de prueba:', error)
    throw new Error('No se pudo obtener token de autenticación para pruebas')
  }
}

/**
 * Limpia los datos de prueba de la base de datos
 * Útil para el cleanUp después de los tests
 */
export async function cleanupTestData(): Promise<void> {
  try {
    // Eliminar usuario de prueba si existe
    await prisma.user.deleteMany({
      where: { correo: 'admin@test.com' },
    })
  } catch (error) {
    console.error('Error limpiando datos de prueba:', error)
  }
}
