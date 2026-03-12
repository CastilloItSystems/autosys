/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Endpoints para autenticación, registro y gestión de contraseñas
 *
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión con correo y contraseña
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - password
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: "admin@test.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "admin123"
 *           example:
 *             correo: "admin@test.com"
 *             password: "admin123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login exitoso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         nombre:
 *                           type: string
 *                         correo:
 *                           type: string
 *                         empresaIds:
 *                           type: array
 *                           items:
 *                             type: string
 *                         activeEmpresaId:
 *                           type: string
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Credenciales inválidas"
 *       500:
 *         description: Error interno del servidor
 *
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - password
 *               - departamento
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: "juan@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "MiContraseña123"
 *               telefono:
 *                 type: string
 *                 example: "+56912345678"
 *               departamento:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ventas", "inventario"]
 *               rol:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, GERENTE, VENDEDOR, ALMACENISTA, MECANICO, CAJERO, CONTADOR, ASESOR, VIEWER]
 *                 default: VIEWER
 *               acceso:
 *                 type: string
 *                 enum: [limitado, completo, ninguno]
 *                 default: ninguno
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Usuario registrado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       400:
 *         description: Datos inválidos o incompletos
 *       409:
 *         description: El correo ya está registrado
 *       500:
 *         description: Error interno del servidor
 *
 * /auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Perfil obtenido exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nombre:
 *                       type: string
 *                     correo:
 *                       type: string
 *                     rol:
 *                       type: string
 *                     estado:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: No autorizado - Token no válido o expirado
 *       500:
 *         description: Error interno del servidor
 *
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logout exitoso"
 *                 data:
 *                   type: "null"
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 *
 * /auth/change-password:
 *   post:
 *     summary: Cambiar contraseña del usuario autenticado
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: "ContraseñaActual123"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "NuevaContraseña456"
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: "NuevaContraseña456"
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Contraseña cambiada exitosamente"
 *                 data:
 *                   type: "null"
 *       400:
 *         description: Las contraseñas no coinciden o contraseña actual incorrecta
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */

import { Router } from 'express'
import {
  login,
  register,
  getProfile,
  logout,
  changePassword,
} from '../controllers/auth.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware.js'

const router = Router()

// Rutas públicas
router.post('/login', login)
router.post('/register', register)

// Rutas protegidas
router.get('/profile', authenticate, getProfile)
router.post('/logout', authenticate, logout)
router.post('/change-password', authenticate, changePassword)

export default router
