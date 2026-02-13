/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Endpoints para autenticación y autorización
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
 *                 example: "usuario@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "MiContraseña123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login exitoso"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
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
 *                       enum: [SUPER_ADMIN, ADMIN, GERENTE, VENDEDOR, ALMACENISTA, MECANICO, CAJERO, CONTADOR, ASESOR, VIEWER]
 *                     estado:
 *                       type: string
 *                       enum: [pendiente, activo, suspendido]
 *       401:
 *         description: Credenciales inválidas
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
 *       400:
 *         description: Datos inválidos
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
 *                 id:
 *                   type: string
 *                 nombre:
 *                   type: string
 *                 correo:
 *                   type: string
 *                 rol:
 *                   type: string
 *                 estado:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: No autorizado
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
 *       401:
 *         description: No autorizado
 *
 * /auth/change-password:
 *   post:
 *     summary: Cambiar contraseña del usuario
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
 *                 example: "NuevaContraseña456"
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *       400:
 *         description: Contraseña actual incorrecta
 *       401:
 *         description: No autorizado
 */

// Nota: Estos ejemplos de documentación servirán para generar automáticamente
// la documentación en Swagger UI cuando se ejecute el servidor.
// Los endpoints reales deben tener implementación en auth.routes.ts y auth.controller.ts
