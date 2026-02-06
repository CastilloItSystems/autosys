import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'

export const getAllEmpresas = async (req: Request, res: Response) => {
  try {
    const empresas = await prisma.empresa.findMany({
      where: {
        eliminado: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({
      total: empresas.length,
      empresas,
    })
  } catch (error) {
    console.error('Error obteniendo empresas:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const createEmpresa = async (req: Request, res: Response) => {
  try {
    const empresaData = req.body
    const currentUserId =
      (req as any).user?.userId || (req as any).user?.id || null

    // Ejecutar creación y auditoría en transacción
    const newEmpresa = await prisma.$transaction(async (tx) => {
      // Si es predeterminada, quitar predeterminado de otras empresas
      if (empresaData.predeter) {
        await tx.empresa.updateMany({
          where: { predeter: true },
          data: { predeter: false },
        })
      }

      const empresa = await tx.empresa.create({
        data: empresaData,
      })

      // Crear registro de auditoría
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

    res.status(201).json(newEmpresa)
  } catch (error) {
    console.error('Error creando empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getEmpresaById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const empresa = await prisma.empresa.findUnique({
      where: { id_empresa: id },
    })

    if (!empresa || empresa.eliminado) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }
    res.json(empresa)
  } catch (error) {
    console.error('Error obteniendo empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const updateEmpresa = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const updateData = req.body
    const currentUserId =
      (req as any).user?.userId || (req as any).user?.id || null

    // Verificar que la empresa existe
    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id_empresa: id },
    })

    if (!existingEmpresa || existingEmpresa.eliminado) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    // Ejecutar actualización y auditoría en transacción
    const updatedEmpresa = await prisma.$transaction(async (tx) => {
      // Si se está marcando como predeterminada, quitar predeterminado de otras
      if (updateData.predeter) {
        await tx.empresa.updateMany({
          where: {
            predeter: true,
            id_empresa: { not: id },
          },
          data: { predeter: false },
        })
      }

      const empresa = await tx.empresa.update({
        where: { id_empresa: id },
        data: updateData,
      })

      // Crear registro de auditoría
      await tx.auditLog.create({
        data: {
          entity: 'Empresa',
          entityId: id,
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

    res.json(updatedEmpresa)
  } catch (error) {
    console.error('Error actualizando empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteEmpresa = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const currentUserId =
      (req as any).user?.userId || (req as any).user?.id || null

    // Verificar que la empresa existe
    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id_empresa: id },
    })

    if (!existingEmpresa || existingEmpresa.eliminado) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    // Ejecutar soft delete y auditoría en transacción
    await prisma.$transaction(async (tx) => {
      await tx.empresa.update({
        where: { id_empresa: id },
        data: { eliminado: true },
      })

      // Crear registro de auditoría
      await tx.auditLog.create({
        data: {
          entity: 'Empresa',
          entityId: id,
          action: 'DELETE',
          userId: currentUserId,
          changes: {
            before: existingEmpresa,
            after: { eliminado: true },
          },
        },
      })
    })

    res.json({ message: 'Empresa eliminada exitosamente' })
  } catch (error) {
    console.error('Error eliminando empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
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

    res.json({
      total: auditLogs.length,
      auditLogs,
    })
  } catch (error) {
    console.error('Error obteniendo logs de auditoría:', error)
    res.status(500).json({
      error: 'Hubo un error al obtener los logs de auditoría.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const getEmpresaPredeterminada = async (req: Request, res: Response) => {
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

    res.json(empresa)
  } catch (error) {
    console.error('Error obteniendo empresa predeterminada:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
