// backend/src/controllers/userPermissions.controller.ts
// Gestión de permisos individuales por usuario (overrides sobre el rol base)

import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'
import { resolvePermissionsFromBase } from '../shared/utils/resolvePermissions.js'

/**
 * GET /users/:id/permissions
 * Devuelve los overrides individuales + permisos efectivos del usuario
 */
export const getUserPermissions = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const user = await prisma.user.findUnique({
      where: { id, eliminado: false },
      select: {
        id: true,
        nombre: true,
        rol: true,
        userEmpresaRoles: {
          include: {
            role: { select: { name: true, permissions: true } },
            empresa: { select: { id_empresa: true, nombre: true } },
          },
        },
        userPermissions: {
          select: {
            id: true,
            permission: true,
            action: true,
            reason: true,
            grantedBy: true,
            createdAt: true,
          },
          orderBy: { permission: 'asc' },
        },
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Permisos base = unión de permissions[] de todos los CompanyRoles del usuario
    const rolePermissions = [
      ...new Set(user.userEmpresaRoles.flatMap((uer) => uer.role.permissions)),
    ]

    // Permisos efectivos = rol base + overrides individuales
    const effectivePermissions = resolvePermissionsFromBase(rolePermissions, user.userPermissions)

    // Todos los permisos disponibles en el sistema
    const allPermissions = Object.values(PERMISSIONS) as string[]

    res.json({
      userId: user.id,
      userName: user.nombre,
      role: user.rol,
      rolePermissions,
      effectivePermissions,
      overrides: user.userPermissions,
      allPermissions,
    })
  } catch (error) {
    console.error('Error obteniendo permisos del usuario:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

/**
 * PUT /users/:id/permissions
 * Reemplaza los overrides individuales de un usuario.
 * Body: { overrides: [{ permission: "inventory:view", action: "GRANT"|"REVOKE", reason?: string }] }
 */
export const setUserPermissions = async (req: Request, res: Response) => {
  const { id } = req.params
  const { overrides } = req.body
  const grantedBy = (req as any).user?.userId || null

  if (!Array.isArray(overrides)) {
    return res.status(400).json({ error: 'overrides debe ser un array' })
  }

  // Validar que los permisos existan en el sistema
  const allPermissions = Object.values(PERMISSIONS) as string[]
  const invalidPermissions = overrides
    .map((o: any) => o.permission)
    .filter((p: string) => !allPermissions.includes(p))

  if (invalidPermissions.length > 0) {
    return res.status(400).json({
      error: 'Permisos inválidos',
      invalidPermissions,
    })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id, eliminado: false },
      select: { id: true, nombre: true, rol: true },
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Transacción: eliminar overrides existentes y crear los nuevos
    await prisma.$transaction(async (tx) => {
      // Eliminar todos los overrides actuales del usuario
      await tx.userPermission.deleteMany({ where: { userId: id } })

      // Crear los nuevos overrides (si hay alguno)
      if (overrides.length > 0) {
        await tx.userPermission.createMany({
          data: overrides.map((o: any) => ({
            userId: id,
            permission: o.permission,
            action: o.action as 'GRANT' | 'REVOKE',
            reason: o.reason || null,
            grantedBy,
          })),
        })
      }

      // Crear registro de auditoría
      await tx.auditLog.create({
        data: {
          entity: 'UserPermission',
          entityId: id,
          action: 'UPDATE',
          userId: grantedBy,
          changes: {
            before: {},
            after: { overrides },
          },
        },
      })
    })

    // Devolver los permisos actualizados
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        rol: true,
        userEmpresaRoles: {
          include: { role: { select: { permissions: true } } },
        },
        userPermissions: {
          select: { permission: true, action: true, reason: true },
          orderBy: { permission: 'asc' },
        },
      },
    })

    const basePermissions = [
      ...new Set(updatedUser!.userEmpresaRoles.flatMap((uer) => uer.role.permissions)),
    ]
    const effectivePermissions = resolvePermissionsFromBase(
      basePermissions,
      updatedUser!.userPermissions
    )

    res.json({
      message: 'Permisos actualizados exitosamente',
      effectivePermissions,
      overrides: updatedUser!.userPermissions,
    })
  } catch (error) {
    console.error('Error actualizando permisos del usuario:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
