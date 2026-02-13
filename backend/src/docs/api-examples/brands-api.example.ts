/**
 * @swagger
 * tags:
 *   - name: Inventory - Catalogs - Brands
 *     description: Gestión de marcas en el inventario
 *
 * /inventory/catalogs/brands:
 *   get:
 *     summary: Obtener todas las marcas
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre
 *     responses:
 *       200:
 *         description: Lista de marcas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nombre:
 *                         type: string
 *                       codigo:
 *                         type: string
 *                       descripcion:
 *                         type: string
 *                       activo:
 *                         type: boolean
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 *
 *   post:
 *     summary: Crear una nueva marca
 *     tags: [Inventory - Catalogs - Brands]
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
 *               - codigo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Nike"
 *               codigo:
 *                 type: string
 *                 example: "NK"
 *               descripcion:
 *                 type: string
 *                 example: "Marca de ropa deportiva"
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Marca creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: La marca ya existe
 *       500:
 *         description: Error interno del servidor
 *
 * /inventory/catalogs/brands/{id}:
 *   get:
 *     summary: Obtener una marca por ID
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la marca
 *     responses:
 *       200:
 *         description: Marca obtenida exitosamente
 *       404:
 *         description: Marca no encontrada
 *       500:
 *         description: Error interno del servidor
 *
 *   put:
 *     summary: Actualizar una marca
 *     tags: [Inventory - Catalogs - Brands]
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
 *             properties:
 *               nombre:
 *                 type: string
 *               codigo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Marca actualizada exitosamente
 *       404:
 *         description: Marca no encontrada
 *       500:
 *         description: Error interno del servidor
 *
 *   delete:
 *     summary: Eliminar una marca
 *     tags: [Inventory - Catalogs - Brands]
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
 *         description: Marca eliminada exitosamente
 *       404:
 *         description: Marca no encontrada
 *       409:
 *         description: La marca está siendo usada
 *       500:
 *         description: Error interno del servidor
 */
