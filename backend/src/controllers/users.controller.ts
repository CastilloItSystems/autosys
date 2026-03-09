import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../services/prisma.service.js'

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { eliminado: false },
      include: {
        empresas: true, // mantenido para compatibilidad durante transición
        userEmpresaRoles: {
          include: {
            empresa: { select: { id_empresa: true, nombre: true } },
            role: { select: { id: true, name: true } },
          },
        },
      },
    })

    res.json({ total: users.length, users })
  } catch (error) {
    res.status(500).json({ error: 'Hubo un error al obtener los usuarios.' })
  }
}

export const createUser = async (req: Request, res: Response) => {
  try {
    // empresaRoles: [{ empresaId, roleId }] — nuevo formato dinámico
    // idEmpresas: string[] — formato legacy, mantenido para compatibilidad
    const { password, idEmpresas, empresaRoles, ...userData } = req.body
    const currentUserId = (req as any).user?.userId || (req as any).user?.id || null
    const assignedBy = currentUserId

    if (!password) {
      return res.status(400).json({ error: 'La contraseña es obligatoria.' })
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    const data: any = { ...userData, password: hashedPassword }

    // Conectar empresas legacy (many-to-many, para compatibilidad)
    if (Array.isArray(idEmpresas) && idEmpresas.length > 0) {
      data.empresas = {
        connect: idEmpresas.map((empId: string) => ({ id_empresa: empId })),
      }
    }

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data,
        include: { empresas: true },
      })

      // Crear asignaciones de rol dinámico por empresa
      if (Array.isArray(empresaRoles) && empresaRoles.length > 0) {
        for (const { empresaId, roleId } of empresaRoles) {
          if (empresaId && roleId) {
            await tx.userEmpresaRole.create({
              data: { userId: user.id, empresaId, roleId, assignedBy },
            })
          }
        }
      }

      await tx.auditLog.create({
        data: {
          entity: 'User',
          entityId: user.id,
          action: 'CREATE',
          userId: currentUserId,
          changes: { before: {}, after: { ...user, password: '[HIDDEN]' } },
        },
      })

      return user
    })

    res.status(201).json(newUser)
  } catch (error) {
    console.error('Error creando usuario:', error)
    res.status(500).json({
      error: 'Hubo un error al crear el usuario.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    const user = await prisma.user.findUnique({
      where: { id: String(id) },
    })
    if (user && !user.eliminado) {
      res.json(user)
    } else {
      res.status(404).json({ error: 'Usuario no encontrado.' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Hubo un error al obtener el usuario.' })
  }
}

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params
  const { password, idEmpresas, empresaRoles, ...userData } = req.body
  const currentUserId = (req as any).user?.userId || (req as any).user?.id || null

  try {
    const oldUser = await prisma.user.findUnique({
      where: { id: String(id) },
      include: { empresas: true, userEmpresaRoles: true },
    })

    if (!oldUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' })
    }

    const data: any = { ...userData }

    if (password) {
      const salt = bcrypt.genSaltSync(10)
      data.password = bcrypt.hashSync(password, salt)
    }

    if (Array.isArray(idEmpresas)) {
      data.empresas = {
        set: idEmpresas.map((empId: string) => ({ id_empresa: empId })),
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: String(id) },
        data,
        include: { empresas: true },
      })

      // Actualizar asignaciones de rol dinámico si se envían
      if (Array.isArray(empresaRoles)) {
        for (const { empresaId, roleId } of empresaRoles) {
          if (empresaId && roleId) {
            await tx.userEmpresaRole.upsert({
              where: { userId_empresaId: { userId: String(id), empresaId } },
              create: { userId: String(id), empresaId, roleId, assignedBy: currentUserId },
              update: { roleId, assignedBy: currentUserId },
            })
          }
        }
      }

      await tx.auditLog.create({
        data: {
          entity: 'User',
          entityId: String(id),
          action: 'UPDATE',
          userId: currentUserId,
          changes: {
            before: { ...oldUser, password: '[HIDDEN]' },
            after: { ...user, password: '[HIDDEN]' },
          },
        },
      })

      return user
    })

    res.json(updatedUser)
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    res.status(500).json({
      error: 'Hubo un error al actualizar el usuario.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params
  const currentUserId =
    (req as any).user?.userId || (req as any).user?.id || null

  try {
    const oldUser = await prisma.user.findUnique({
      where: { id: String(id) },
      include: { empresas: true },
    })

    if (!oldUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' })
    }

    // Ejecutar eliminación y auditoría en transacción
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: String(id) },
        data: { eliminado: true },
      })

      // Crear registro de auditoría para la eliminación
      const cleanOld = { ...oldUser, password: '[HIDDEN]' }

      await tx.auditLog.create({
        data: {
          entity: 'User',
          entityId: String(id),
          action: 'DELETE',
          userId: currentUserId,
          changes: {
            before: cleanOld,
            after: { eliminado: true },
          },
        },
      })
    })

    res.status(204).send() // No Content
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    res.status(500).json({
      error: 'Hubo un error al eliminar el usuario.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const getAuditLogsForUser = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'User',
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

export const saveToken = async (req: any, res: Response) => {
  try {
    const { token } = req.body
    const userId = req.user?.userId

    if (!token || !userId) {
      return res.status(400).json({ error: 'Token y usuario son requeridos' })
    }

    // Obtener el usuario actual para verificar si el token ya existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmTokens: true },
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Evitar duplicados
    if (user.fcmTokens.includes(token)) {
      return res.json({ message: 'El token ya está registrado' })
    }

    // Agregar el nuevo token al array
    await prisma.user.update({
      where: { id: userId },
      data: {
        fcmTokens: {
          push: token,
        },
      },
    })

    res.json({ message: 'Token guardado exitosamente' })
  } catch (error) {
    console.error('Error guardando FCM token:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
