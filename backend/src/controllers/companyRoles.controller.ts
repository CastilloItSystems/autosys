// backend/src/controllers/companyRoles.controller.ts
// CRUD de roles dinámicos por empresa (CompanyRole + UserEmpresaRole)

import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'

const ALL_PERMISSIONS = Object.values(PERMISSIONS) as string[]

/**
 * GET /empresas/:id/roles
 * Lista todos los roles de una empresa con el count de usuarios asignados.
 */
export const getCompanyRoles = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const roles = await prisma.companyRole.findMany({
      where: { empresaId: id },
      include: {
        _count: { select: { userEmpresaRoles: true } },
      },
      orderBy: { name: 'asc' },
    })

    res.json({ roles })
  } catch (error) {
    console.error('Error obteniendo roles de empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

/**
 * POST /empresas/:id/roles
 * Crea un nuevo rol para la empresa.
 * Body: { name, description?, permissions[] }
 */
export const createCompanyRole = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, description, permissions = [] } = req.body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'El nombre del rol es requerido' })
  }

  // Validar que los permisos existan en el catálogo
  const invalidPerms = permissions.filter((p: string) => !ALL_PERMISSIONS.includes(p))
  if (invalidPerms.length > 0) {
    return res.status(400).json({ error: 'Permisos inválidos', invalidPerms })
  }

  try {
    // Verificar que la empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id_empresa: id, eliminado: false },
    })
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    // Verificar unicidad del nombre dentro de la empresa
    const existing = await prisma.companyRole.findUnique({
      where: { name_empresaId: { name: name.trim(), empresaId: id } },
    })
    if (existing) {
      return res.status(409).json({ error: `Ya existe un rol con el nombre "${name}" en esta empresa` })
    }

    const role = await prisma.companyRole.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        empresaId: id,
        permissions,
        isSystem: false,
      },
      include: {
        _count: { select: { userEmpresaRoles: true } },
      },
    })

    res.status(201).json({ role })
  } catch (error) {
    console.error('Error creando rol de empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

/**
 * PUT /empresas/:id/roles/:roleId
 * Actualiza nombre, descripción y/o permisos de un rol.
 * Body: { name?, description?, permissions[]? }
 */
export const updateCompanyRole = async (req: Request, res: Response) => {
  const { id, roleId } = req.params
  const { name, description, permissions } = req.body

  try {
    const role = await prisma.companyRole.findFirst({
      where: { id: roleId, empresaId: id },
    })

    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' })
    }

    // Validar permisos si se envían
    if (permissions !== undefined) {
      const invalidPerms = permissions.filter((p: string) => !ALL_PERMISSIONS.includes(p))
      if (invalidPerms.length > 0) {
        return res.status(400).json({ error: 'Permisos inválidos', invalidPerms })
      }
    }

    // Si se cambia el nombre, verificar unicidad
    if (name && name.trim() !== role.name) {
      const existing = await prisma.companyRole.findUnique({
        where: { name_empresaId: { name: name.trim(), empresaId: id } },
      })
      if (existing) {
        return res.status(409).json({ error: `Ya existe un rol con el nombre "${name}" en esta empresa` })
      }
    }

    const updated = await prisma.companyRole.update({
      where: { id: roleId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(permissions !== undefined && { permissions }),
      },
      include: {
        _count: { select: { userEmpresaRoles: true } },
      },
    })

    res.json({ role: updated })
  } catch (error) {
    console.error('Error actualizando rol de empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

/**
 * DELETE /empresas/:id/roles/:roleId
 * Elimina un rol. Rechaza si hay usuarios asignados (409).
 * No permite eliminar roles de sistema (isSystem: true).
 */
export const deleteCompanyRole = async (req: Request, res: Response) => {
  const { id, roleId } = req.params

  try {
    const role = await prisma.companyRole.findFirst({
      where: { id: roleId, empresaId: id },
      include: {
        _count: { select: { userEmpresaRoles: true } },
      },
    })

    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' })
    }

    if (role.isSystem) {
      return res.status(403).json({
        error: 'No se puede eliminar un rol de sistema. Puedes editar sus permisos.',
      })
    }

    if (role._count.userEmpresaRoles > 0) {
      return res.status(409).json({
        error: `Este rol está asignado a ${role._count.userEmpresaRoles} usuario(s). Reasigna los usuarios antes de eliminarlo.`,
        usersCount: role._count.userEmpresaRoles,
      })
    }

    await prisma.companyRole.delete({ where: { id: roleId } })

    res.json({ message: 'Rol eliminado exitosamente' })
  } catch (error) {
    console.error('Error eliminando rol de empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

/**
 * PUT /empresas/:id/users/:userId/role
 * Asigna (o cambia) el rol de un usuario dentro de una empresa.
 * Body: { roleId }
 */
export const assignUserRole = async (req: Request, res: Response) => {
  const { id: empresaId, userId } = req.params
  const { roleId } = req.body
  const assignedBy = (req as any).user?.userId || null

  if (!roleId) {
    return res.status(400).json({ error: 'roleId es requerido' })
  }

  try {
    // Verificar que el rol pertenece a la empresa
    const role = await prisma.companyRole.findFirst({
      where: { id: roleId, empresaId },
    })
    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado en esta empresa' })
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId, eliminado: false },
    })
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Upsert: si ya tiene un rol en esta empresa, lo reemplaza
    const assignment = await prisma.userEmpresaRole.upsert({
      where: { userId_empresaId: { userId, empresaId } },
      create: { userId, empresaId, roleId, assignedBy },
      update: { roleId, assignedBy },
      include: {
        role: { select: { id: true, name: true, permissions: true } },
        empresa: { select: { id_empresa: true, nombre: true } },
      },
    })

    res.json({
      message: `Rol "${role.name}" asignado exitosamente`,
      assignment,
    })
  } catch (error) {
    console.error('Error asignando rol a usuario:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

/**
 * DELETE /empresas/:id/users/:userId/role
 * Remueve la asignación de rol de un usuario en una empresa.
 */
export const removeUserRole = async (req: Request, res: Response) => {
  const { id: empresaId, userId } = req.params

  try {
    const assignment = await prisma.userEmpresaRole.findUnique({
      where: { userId_empresaId: { userId, empresaId } },
    })

    if (!assignment) {
      return res.status(404).json({ error: 'El usuario no tiene rol en esta empresa' })
    }

    await prisma.userEmpresaRole.delete({
      where: { userId_empresaId: { userId, empresaId } },
    })

    res.json({ message: 'Rol removido exitosamente' })
  } catch (error) {
    console.error('Error removiendo rol de usuario:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
