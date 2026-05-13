import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'
import { invalidateMembershipsCache } from '../features/notifications/memberships-permissions.cache.js'
import { getIO } from '../socket/index.js'

export const getMembershipsByEmpresa = async (req: Request, res: Response) => {
  try {
    if (!req.empresaId) {
      return res.status(400).json({ error: 'Empresa no especificada.' })
    }

    const memberships = await prisma.membership.findMany({
      where: {
        empresaId: req.empresaId,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            telefono: true,
            estado: true,
            eliminado: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    })

    return res.json({
      total: memberships.length,
      memberships,
    })
  } catch (error) {
    console.error('Error obteniendo memberships:', error)
    return res.status(500).json({
      error: 'Hubo un error al obtener las memberships.',
    })
  }
}

export const getMembershipsByUser = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    if (!req.empresaId) {
      return res.status(400).json({ error: 'Empresa no especificada.' })
    }

    const memberships = await prisma.membership.findMany({
      where: {
        userId: String(id),
        empresaId: req.empresaId,
      },
      include: {
        empresa: {
          select: {
            id_empresa: true,
            nombre: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    })

    return res.json({
      total: memberships.length,
      memberships,
    })
  } catch (error) {
    console.error('Error obteniendo memberships del usuario:', error)
    return res.status(500).json({
      error: 'Hubo un error al obtener las memberships del usuario.',
    })
  }
}

export const createMembership = async (req: Request, res: Response) => {
  try {
    if (!req.empresaId) {
      return res.status(400).json({ error: 'Empresa no especificada.' })
    }

    const { userId, empresaId: requestedEmpresaId, roleId, status } = req.body
    const empresaId = req.empresaId
    const assignedBy = req.user?.userId || null

    if (!userId || !roleId) {
      return res.status(400).json({
        error: 'userId y roleId son requeridos.',
      })
    }

    if (requestedEmpresaId && requestedEmpresaId !== empresaId) {
      return res.status(403).json({
        error: 'No tienes permisos para crear memberships en otra empresa.',
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
    })

    if (!user || user.eliminado) {
      return res.status(404).json({
        error: 'Usuario no encontrado.',
      })
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id_empresa: String(empresaId) },
    })

    if (!empresa || empresa.eliminado) {
      return res.status(404).json({
        error: 'Empresa no encontrada.',
      })
    }

    const role = await prisma.companyRole.findFirst({
      where: {
        id: String(roleId),
        empresaId: String(empresaId),
      },
    })

    if (!role) {
      return res.status(400).json({
        error: 'El rol no pertenece a la empresa especificada.',
      })
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_empresaId: {
          userId: String(userId),
          empresaId: String(empresaId),
        },
      },
    })

    if (existingMembership) {
      return res.status(409).json({
        error: 'El usuario ya pertenece a esta empresa.',
      })
    }

    const membership = await prisma.membership.create({
      data: {
        userId: String(userId),
        empresaId: String(empresaId),
        roleId: String(roleId),
        status: status || 'active',
        assignedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            correo: true,
          },
        },
        empresa: {
          select: {
            id_empresa: true,
            nombre: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    invalidateMembershipsCache(String(empresaId))
    return res.status(201).json(membership)
  } catch (error) {
    console.error('Error creando membership:', error)
    return res.status(500).json({
      error: 'Hubo un error al crear la membership.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const updateMembership = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    if (!req.empresaId) {
      return res.status(400).json({ error: 'Empresa no especificada.' })
    }

    const { roleId, status } = req.body
    const assignedBy = req.user?.userId || null

    const existingMembership = await prisma.membership.findUnique({
      where: { id: String(id) },
    })

    if (!existingMembership) {
      return res.status(404).json({
        error: 'Membership no encontrada.',
      })
    }

    if (existingMembership.empresaId !== req.empresaId) {
      return res.status(403).json({
        error: 'No tienes permisos para actualizar esta membership.',
      })
    }

    if (roleId) {
      const role = await prisma.companyRole.findFirst({
        where: {
          id: String(roleId),
          empresaId: existingMembership.empresaId,
        },
      })

      if (!role) {
        return res.status(400).json({
          error: 'El rol no pertenece a la empresa de la membership.',
        })
      }
    }

    const membership = await prisma.membership.update({
      where: { id: String(id) },
      data: {
        ...(roleId ? { roleId: String(roleId) } : {}),
        ...(status ? { status } : {}),
        assignedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            correo: true,
          },
        },
        empresa: {
          select: {
            id_empresa: true,
            nombre: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    invalidateMembershipsCache(existingMembership.empresaId)
    return res.json(membership)
  } catch (error) {
    console.error('Error actualizando membership:', error)
    return res.status(500).json({
      error: 'Hubo un error al actualizar la membership.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const deleteMembership = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    if (!req.empresaId) {
      return res.status(400).json({ error: 'Empresa no especificada.' })
    }

    const existingMembership = await prisma.membership.findUnique({
      where: { id: String(id) },
    })

    if (!existingMembership) {
      return res.status(404).json({
        error: 'Membership no encontrada.',
      })
    }

    if (existingMembership.empresaId !== req.empresaId) {
      return res.status(403).json({
        error: 'No tienes permisos para eliminar esta membership.',
      })
    }

    await prisma.membership.delete({
      where: { id: String(id) },
    })

    invalidateMembershipsCache(existingMembership.empresaId)
    return res.status(204).send()
  } catch (error) {
    console.error('Error eliminando membership:', error)
    return res.status(500).json({
      error: 'Hubo un error al eliminar la membership.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

/**
 * GET /memberships/:id/permissions
 * Retorna los permisos del rol base, los overrides individuales y el set efectivo.
 */
export const getMembershipPermissions = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const membership = await prisma.membership.findUnique({
      where: { id: String(id) },
      include: {
        user: { select: { id: true, nombre: true, correo: true } },
        empresa: { select: { id_empresa: true, nombre: true } },
        role: {
          include: {
            permissions: {
              include: { permission: { select: { id: true, code: true } } },
            },
          },
        },
        permissions: {
          include: { permission: { select: { id: true, code: true } } },
        },
      },
    })

    if (!membership) {
      return res.status(404).json({ error: 'Membership no encontrada.' })
    }

    if (req.empresaId && membership.empresaId !== req.empresaId) {
      return res.status(403).json({
        error: 'No tienes permisos para consultar esta membership.',
      })
    }

    const rolePermissions = membership.role.permissions.map(
      (rp) => rp.permission.code
    )

    const overrides = membership.permissions.map((mp) => ({
      permissionCode: mp.permission.code,
      action: mp.action,
      reason: mp.reason,
    }))

    // Calcular permisos efectivos
    const effective = new Set(rolePermissions)
    for (const o of overrides) {
      if (o.action === 'GRANT') effective.add(o.permissionCode)
      if (o.action === 'REVOKE') effective.delete(o.permissionCode)
    }

    return res.json({
      membershipId: membership.id,
      user: membership.user,
      empresa: membership.empresa,
      roleName: membership.role.name,
      rolePermissions,
      overrides,
      effectivePermissions: Array.from(effective),
    })
  } catch (error) {
    console.error('Error obteniendo permisos de membership:', error)
    return res
      .status(500)
      .json({ error: 'Hubo un error al obtener los permisos.' })
  }
}

/**
 * PUT /memberships/:id/permissions
 * Reemplaza todos los overrides de permiso para una membership.
 * Body: { overrides: [{ permissionCode: string, action: 'GRANT'|'REVOKE', reason?: string }] }
 */
export const setMembershipPermissions = async (req: Request, res: Response) => {
  const { id } = req.params
  const { overrides } = req.body
  const grantedBy = req.user?.userId || null

  if (!Array.isArray(overrides)) {
    return res.status(400).json({ error: 'overrides debe ser un array.' })
  }

  // Validar actions
  for (const o of overrides) {
    if (!['GRANT', 'REVOKE'].includes(o.action)) {
      return res
        .status(400)
        .json({
          error: `Acción inválida: ${o.action}. Debe ser GRANT o REVOKE.`,
        })
    }
  }

  try {
    const membership = await prisma.membership.findUnique({
      where: { id: String(id) },
    })

    if (!membership) {
      return res.status(404).json({ error: 'Membership no encontrada.' })
    }

    if (req.empresaId && membership.empresaId !== req.empresaId) {
      return res.status(403).json({
        error: 'No tienes permisos para actualizar esta membership.',
      })
    }

    // Resolver Permission IDs a partir de los códigos
    const codes: string[] = overrides.map((o: any) => o.permissionCode)
    const found =
      codes.length > 0
        ? await prisma.permission.findMany({ where: { code: { in: codes } } })
        : []

    if (found.length !== codes.length) {
      const missing = codes.filter((c) => !found.find((p) => p.code === c))
      return res.status(400).json({ error: 'Permisos inválidos', missing })
    }

    // Reemplazar overrides en una transacción
    await prisma.$transaction(async (tx) => {
      await tx.membershipPermission.deleteMany({
        where: { membershipId: String(id) },
      })

      if (overrides.length > 0) {
        await tx.membershipPermission.createMany({
          data: overrides.map((o: any) => ({
            membershipId: String(id),
            permissionId: found.find((p) => p.code === o.permissionCode)!.id,
            action: o.action as 'GRANT' | 'REVOKE',
            reason: o.reason || null,
            grantedBy,
          })),
        })
      }
    })

    invalidateMembershipsCache(membership.empresaId)
    getIO()
      .to(`user-${membership.userId}`)
      .emit('membership:permissions-changed', { empresaId: membership.empresaId })
    return res.json({ message: 'Permisos actualizados exitosamente.' })
  } catch (error) {
    console.error('Error actualizando permisos de membership:', error)
    return res
      .status(500)
      .json({ error: 'Hubo un error al actualizar los permisos.' })
  }
}
