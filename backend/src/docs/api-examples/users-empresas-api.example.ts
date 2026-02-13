/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Gestión de usuarios del sistema
 *
 * /users:
 *   get:
 *     summary: Obtener lista de usuarios
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, GERENTE, VENDEDOR, ALMACENISTA, MECANICO, CAJERO, CONTADOR, ASESOR, VIEWER]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activo, suspendido, pendiente]
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
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
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, GERENTE, VENDEDOR, ALMACENISTA, MECANICO, CAJERO, CONTADOR, ASESOR, VIEWER]
 *               estado:
 *                 type: string
 *                 enum: [activo, suspendido, pendiente]
 *     responses:
 *       201:
 *         description: Usuario creado
 *       400:
 *         description: Datos inválidos
 *
 * /users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario obtenido
 *       404:
 *         description: Usuario no encontrado
 *
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 *
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       404:
 *         description: Usuario no encontrado
 *
 * /users/{id}/audit-logs:
 *   get:
 *     summary: Obtener historial de auditoria del usuario
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Historial de auditoría
 *       404:
 *         description: Usuario no encontrado
 *
 * tags:
 *   - name: Empresas
 *     description: Gestión de empresas
 *
 * /empresas:
 *   get:
 *     summary: Obtener lista de empresas
 *     tags: [Empresas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de empresas
 *       401:
 *         description: No autorizado
 *
 *   post:
 *     summary: Crear una nueva empresa
 *     tags: [Empresas]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - rut
 *             properties:
 *               nombre:
 *                 type: string
 *               rut:
 *                 type: string
 *               giro:
 *                 type: string
 *               direccion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Empresa creada
 *       400:
 *         description: Datos inválidos
 *
 * /empresas/{id}:
 *   get:
 *     summary: Obtener empresa por ID
 *     tags: [Empresas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Empresa obtenida
 *       404:
 *         description: Empresa no encontrada
 *
 *   put:
 *     summary: Actualizar empresa
 *     tags: [Empresas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Empresa actualizada
 *       404:
 *         description: Empresa no encontrada
 *
 *   delete:
 *     summary: Eliminar empresa
 *     tags: [Empresas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Empresa eliminada
 *       404:
 *         description: Empresa no encontrada
 *
 * /empresas/{id}/audit-logs:
 *   get:
 *     summary: Obtener historial de auditoría de empresa
 *     tags: [Empresas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historial de auditoría
 *       404:
 *         description: Empresa no encontrada
 */
