import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'
import {
  ensurePermissionCatalog,
  seedDefaultRolesForEmpresa,
} from '../services/empresa-setup.service.js'

export const getAllEmpresas = async (_req: Request, res: Response) => {
  try {
    const empresas = await prisma.empresa.findMany({
      where: {
        eliminado: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.json({
      total: empresas.length,
      empresas,
    })
  } catch (error) {
    console.error('Error obteniendo empresas:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const createEmpresa = async (req: Request, res: Response) => {
  try {
    const empresaData = req.body
    const currentUserId = req.user?.userId || null

    const newEmpresa = await prisma.$transaction(async (tx) => {
      if (empresaData.predeter) {
        await tx.empresa.updateMany({
          where: { predeter: true },
          data: { predeter: false },
        })
      }

      const empresa = await tx.empresa.create({
        data: empresaData,
      })

      await tx.auditLog.create({
        data: {
          entity: 'Empresa',
          entityId: empresa.id_empresa,
          action: 'CREATE',
          userId: currentUserId,
          changes: {
            before: {},
            after: empresa,
          },
        },
      })

      return empresa
    })

    // Inicializar permisos globales (idempotente) y roles predeterminados
    await ensurePermissionCatalog()
    await seedDefaultRolesForEmpresa(newEmpresa.id_empresa)

    return res.status(201).json(newEmpresa)
  } catch (error) {
    console.error('Error creando empresa:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getEmpresaById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id

    const empresa = await prisma.empresa.findUnique({
      where: { id_empresa: String(id) },
    })

    if (!empresa || empresa.eliminado) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    return res.json(empresa)
  } catch (error) {
    console.error('Error obteniendo empresa:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const updateEmpresa = async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const updateData = req.body
    const currentUserId = req.user?.userId || null

    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id_empresa: String(id) },
    })

    if (!existingEmpresa || existingEmpresa.eliminado) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    const updatedEmpresa = await prisma.$transaction(async (tx) => {
      if (updateData.predeter) {
        await tx.empresa.updateMany({
          where: {
            predeter: true,
            id_empresa: { not: String(id) },
          },
          data: { predeter: false },
        })
      }

      const empresa = await tx.empresa.update({
        where: { id_empresa: String(id) },
        data: updateData,
      })

      await tx.auditLog.create({
        data: {
          entity: 'Empresa',
          entityId: String(id),
          action: 'UPDATE',
          userId: currentUserId,
          changes: {
            before: existingEmpresa,
            after: empresa,
          },
        },
      })

      return empresa
    })

    return res.json(updatedEmpresa)
  } catch (error) {
    console.error('Error actualizando empresa:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteEmpresa = async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const currentUserId = req.user?.userId || null

    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id_empresa: String(id) },
    })

    if (!existingEmpresa || existingEmpresa.eliminado) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.empresa.update({
        where: { id_empresa: String(id) },
        data: { eliminado: true },
      })

      await tx.auditLog.create({
        data: {
          entity: 'Empresa',
          entityId: String(id),
          action: 'DELETE',
          userId: currentUserId,
          changes: {
            before: existingEmpresa,
            after: { eliminado: true },
          },
        },
      })
    })

    return res.json({ message: 'Empresa eliminada exitosamente' })
  } catch (error) {
    console.error('Error eliminando empresa:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

/**
 * POST /empresas/:id/seed-defaults
 * (Re)creates the default system roles for an existing empresa.
 * Useful for empresas created before the auto-seeding was in place.
 * Requires OWNER or ADMIN via authorizeGlobal.
 */
export const seedDefaultsForEmpresa = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id_empresa: String(id), eliminado: false },
    })
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    await ensurePermissionCatalog()
    await seedDefaultRolesForEmpresa(String(id))

    return res.json({
      ok: true,
      message: 'Roles predeterminados sincronizados',
    })
  } catch (error) {
    console.error('Error sincronizando roles predeterminados:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAuditLogsForEmpresa = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'Empresa',
        entityId: String(id),
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            correo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.json({
      total: auditLogs.length,
      auditLogs,
    })
  } catch (error) {
    console.error('Error obteniendo logs de auditoría:', error)
    return res.status(500).json({
      error: 'Hubo un error al obtener los logs de auditoría.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const getEmpresaPredeterminada = async (
  _req: Request,
  res: Response
) => {
  try {
    const empresa = await prisma.empresa.findFirst({
      where: {
        predeter: true,
        eliminado: false,
      },
    })

    if (!empresa) {
      return res.status(404).json({ error: 'No hay empresa predeterminada' })
    }

    return res.json(empresa)
  } catch (error) {
    console.error('Error obteniendo empresa predeterminada:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
