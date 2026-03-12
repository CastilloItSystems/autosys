// backend/src/controllers/companyRoles.controller.ts
// CRUD de roles dinámicos por empresa

import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'

// Helper: incluir permisos como string[] de códigos en la respuesta
const ROLE_INCLUDE = {
  _count: { select: { memberships: true } },
  permissions: {
    include: {
      permission: { select: { code: true } },
    },
  },
} as const

function mapRole(role: any) {
  return {
    ...role,
    permissions: role.permissions.map((rp: any) => rp.permission.code),
  }
}

/**
 * GET /empresas/:id/roles
 * Lista todos los roles de una empresa con sus permisos y count de memberships.
 */
export const getCompanyRoles = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const roles = await prisma.companyRole.findMany({
      where: { empresaId: id },
      include: ROLE_INCLUDE,
      orderBy: { name: 'asc' },
    })

    res.json({ roles: roles.map(mapRole) })
  } catch (error) {
    console.error('Error obteniendo roles de empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

/**
 * POST /empresas/:id/roles
 * Crea un nuevo rol para la empresa.
 * Body: { name, description?, permissionCodes: string[] }
 */
export const createCompanyRole = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, description, permissionCodes = [] } = req.body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'El nombre del rol es requerido' })
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
      return res
        .status(409)
        .json({
          error: `Ya existe un rol con el nombre "${name}" en esta empresa`,
        })
    }

    // Resolver Permission IDs a partir de los códigos
    const foundPermissions =
      permissionCodes.length > 0
        ? await prisma.permission.findMany({
            where: { code: { in: permissionCodes } },
          })
        : []

    const foundCodes = foundPermissions.map((p) => p.code)
    const invalidCodes = (permissionCodes as string[]).filter(
      (c) => !foundCodes.includes(c)
    )
    if (invalidCodes.length > 0) {
      return res.status(400).json({ error: 'Permisos inválidos', invalidCodes })
    }

    const role = await prisma.companyRole.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        empresaId: id,
        isSystem: false,
        permissions: {
          create: foundPermissions.map((p) => ({ permissionId: p.id })),
        },
      },
      include: ROLE_INCLUDE,
    })

    res.status(201).json({ role: mapRole(role) })
  } catch (error) {
    console.error('Error creando rol de empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

/**
 * PUT /empresas/:id/roles/:roleId
 * Actualiza nombre, descripción y/o permisos de un rol.
 * Body: { name?, description?, permissionCodes?: string[] }
 */
export const updateCompanyRole = async (req: Request, res: Response) => {
  const { id, roleId } = req.params
  const { name, description, permissionCodes } = req.body

  try {
    const role = await prisma.companyRole.findFirst({
      where: { id: roleId, empresaId: id },
    })

    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' })
    }

    // Resolver permisos si se envían
    let foundPermissions: { id: string; code: string }[] = []
    if (permissionCodes !== undefined) {
      foundPermissions =
        permissionCodes.length > 0
          ? await prisma.permission.findMany({
              where: { code: { in: permissionCodes } },
            })
          : []

      const foundCodes = foundPermissions.map((p) => p.code)
      const invalidCodes = (permissionCodes as string[]).filter(
        (c) => !foundCodes.includes(c)
      )
      if (invalidCodes.length > 0) {
        return res
          .status(400)
          .json({ error: 'Permisos inválidos', invalidCodes })
      }
    }

    // Verificar unicidad del nombre si cambia
    if (name !== undefined && name.trim() !== role.name) {
      const existing = await prisma.companyRole.findUnique({
        where: { name_empresaId: { name: name.trim(), empresaId: id } },
      })
      if (existing) {
        return res
          .status(409)
          .json({
            error: `Ya existe un rol con el nombre "${name}" en esta empresa`,
          })
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (permissionCodes !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId } })
        if (foundPermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: foundPermissions.map((p) => ({ roleId, permissionId: p.id })),
          })
        }
      }

      return tx.companyRole.update({
        where: { id: roleId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(description !== undefined && {
            description: description?.trim() || null,
          }),
        },
        include: ROLE_INCLUDE,
      })
    })

    res.json({ role: mapRole(updated) })
  } catch (error) {
    console.error('Error actualizando rol de empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

/**
 * DELETE /empresas/:id/roles/:roleId
 * Elimina un rol. Rechaza si tiene memberships activas (409).
 * No permite eliminar roles de sistema (isSystem: true).
 */
export const deleteCompanyRole = async (req: Request, res: Response) => {
  const { id, roleId } = req.params

  try {
    const role = await prisma.companyRole.findFirst({
      where: { id: roleId, empresaId: id },
      include: {
        _count: { select: { memberships: true } },
      },
    })

    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' })
    }

    if (role.isSystem) {
      return res.status(403).json({
        error:
          'No se puede eliminar un rol de sistema. Puedes editar sus permisos.',
      })
    }

    if (role._count.memberships > 0) {
      return res.status(409).json({
        error: `Este rol está asignado a ${role._count.memberships} membership(s) activa(s). Reasigna los usuarios antes de eliminarlo.`,
        membershipsCount: role._count.memberships,
      })
    }

    await prisma.companyRole.delete({ where: { id: roleId } })

    res.json({ message: 'Rol eliminado exitosamente' })
  } catch (error) {
    console.error('Error eliminando rol de empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
