import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../services/prisma.service.js'
import r2StorageService from '../services/r2-storage.service.js'
import { invalidateMembershipsCache } from '../features/notifications/memberships-permissions.cache.js'

export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen.' })
    }

    const user = await prisma.user.findUnique({
      where: { id: String(id) },
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' })
    }

    // Eliminar imagen anterior si existe en R2
    if (user.img && user.img.includes('r2.cloudflarestorage.com')) {
      await r2StorageService.deleteFile(user.img)
    }

    const imageUrl = await r2StorageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'profiles'
    )

    const updatedUser = await prisma.user.update({
      where: { id: String(id) },
      data: { img: imageUrl },
      select: {
        id: true,
        img: true,
        nombre: true,
        correo: true,
      },
    })

    return res.json(updatedUser)
  } catch (error) {
    console.error('Error subiendo imagen de perfil:', error)
    return res.status(500).json({ error: 'Error al subir la imagen.' })
  }
}

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { eliminado: false },
      select: {
        id: true,
        img: true,
        nombre: true,
        correo: true,
        telefono: true,
        departamento: true,
        acceso: true,
        estado: true,
        eliminado: true,
        online: true,
        google: true,
        isTechnician: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.json({
      total: users.length,
      users,
    })
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    return res.status(500).json({
      error: 'Hubo un error al obtener los usuarios.',
    })
  }
}

// Busca usuarios existentes para AGREGARLOS a la empresa activa (asignar
// membresía). Empresa-scoped: requiere X-Empresa-Id + users.update. Excluye los
// que ya son miembros y devuelve solo campos públicos mínimos. La creación de
// usuarios sigue siendo exclusiva del área global (/users).
export const searchUsers = async (req: Request, res: Response) => {
  try {
    if (!req.empresaId) {
      return res.status(400).json({ error: 'Empresa no especificada.' })
    }

    const q = String(req.query.q ?? '').trim()
    if (q.length < 2) {
      return res.json({ users: [] })
    }

    const users = await prisma.user.findMany({
      where: {
        eliminado: false,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { correo: { contains: q, mode: 'insensitive' } },
        ],
        // Solo usuarios que aún NO pertenecen a la empresa activa.
        memberships: { none: { empresaId: req.empresaId } },
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        img: true,
      },
      take: 10,
      orderBy: { nombre: 'asc' },
    })

    return res.json({ users })
  } catch (error) {
    console.error('Error buscando usuarios:', error)
    return res.status(500).json({ error: 'Hubo un error al buscar usuarios.' })
  }
}

export const getCompanyUsers = async (req: Request, res: Response) => {
  try {
    if (!req.empresaId) {
      return res.status(400).json({ error: 'Empresa no especificada.' })
    }

    const users = await prisma.user.findMany({
      where: {
        eliminado: false,
        memberships: {
          some: {
            empresaId: req.empresaId,
          },
        },
      },
      select: {
        id: true,
        img: true,
        nombre: true,
        correo: true,
        telefono: true,
        departamento: true,
        acceso: true,
        estado: true,
        eliminado: true,
        online: true,
        google: true,
        isTechnician: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          where: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.json({
      total: users.length,
      users,
    })
  } catch (error) {
    console.error('Error obteniendo usuarios de empresa:', error)
    return res.status(500).json({
      error: 'Hubo un error al obtener los usuarios de la empresa.',
    })
  }
}

export const createUser = async (req: Request, res: Response) => {
  try {
    const { password, ...userData } = req.body

    if (!password) {
      return res.status(400).json({
        error: 'La contraseña es obligatoria.',
      })
    }

    if (!userData.correo) {
      return res.status(400).json({
        error: 'El correo es obligatorio.',
      })
    }

    const correo = String(userData.correo).trim().toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { correo },
    })

    if (existingUser) {
      return res.status(409).json({
        error: 'Ya existe un usuario con ese correo.',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        ...userData,
        correo,
        password: hashedPassword,
      },
      select: {
        id: true,
        img: true,
        nombre: true,
        correo: true,
        telefono: true,
        departamento: true,
        acceso: true,
        estado: true,
        eliminado: true,
        online: true,
        google: true,
        isTechnician: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return res.status(201).json(newUser)
  } catch (error) {
    console.error('Error creando usuario:', error)
    return res.status(500).json({
      error: 'Hubo un error al crear el usuario.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const createCompanyUser = async (req: Request, res: Response) => {
  try {
    if (!req.empresaId) {
      return res.status(400).json({ error: 'Empresa no especificada.' })
    }

    const { password, roleId, membershipStatus, ...userData } = req.body

    if (!password) {
      return res.status(400).json({
        error: 'La contraseña es obligatoria.',
      })
    }

    if (!userData.correo) {
      return res.status(400).json({
        error: 'El correo es obligatorio.',
      })
    }

    if (!roleId) {
      return res.status(400).json({
        error: 'El rol de empresa es obligatorio.',
      })
    }

    const role = await prisma.companyRole.findFirst({
      where: {
        id: String(roleId),
        empresaId: req.empresaId,
      },
    })

    if (!role) {
      return res.status(400).json({
        error: 'El rol no pertenece a la empresa activa.',
      })
    }

    const correo = String(userData.correo).trim().toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { correo },
    })

    if (existingUser) {
      return res.status(409).json({
        error: 'Ya existe un usuario con ese correo.',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          ...userData,
          correo,
          password: hashedPassword,
        },
        select: {
          id: true,
        },
      })

      await tx.membership.create({
        data: {
          userId: createdUser.id,
          empresaId: req.empresaId!,
          roleId: String(roleId),
          status: membershipStatus || 'active',
          assignedBy: req.user?.userId || null,
        },
      })

      return tx.user.findUnique({
        where: { id: createdUser.id },
        select: {
          id: true,
          img: true,
          nombre: true,
          correo: true,
          telefono: true,
          departamento: true,
          acceso: true,
          estado: true,
          eliminado: true,
          online: true,
          google: true,
          isTechnician: true,
          createdAt: true,
          updatedAt: true,
          memberships: {
            where: {
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
          },
        },
      })
    })

    invalidateMembershipsCache(req.empresaId)
    return res.status(201).json(newUser)
  } catch (error) {
    console.error('Error creando usuario de empresa:', error)
    return res.status(500).json({
      error: 'Hubo un error al crear el usuario de la empresa.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const user = await prisma.user.findUnique({
      where: { id: String(id) },
      select: {
        id: true,
        img: true,
        nombre: true,
        correo: true,
        telefono: true,
        departamento: true,
        acceso: true,
        estado: true,
        eliminado: true,
        online: true,
        google: true,
        isTechnician: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
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
        },
      },
    })

    if (!user || user.eliminado) {
      return res.status(404).json({
        error: 'Usuario no encontrado.',
      })
    }

    return res.json(user)
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return res.status(500).json({
      error: 'Hubo un error al obtener el usuario.',
    })
  }
}

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params
  const { password, ...userData } = req.body

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: String(id) },
    })

    if (!existingUser || existingUser.eliminado) {
      return res.status(404).json({
        error: 'Usuario no encontrado.',
      })
    }

    const data: Record<string, unknown> = { ...userData }

    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }

    if (userData.correo) {
      data.correo = String(userData.correo).trim().toLowerCase()
    }

    const updatedUser = await prisma.user.update({
      where: { id: String(id) },
      data,
      select: {
        id: true,
        img: true,
        nombre: true,
        correo: true,
        telefono: true,
        departamento: true,
        acceso: true,
        estado: true,
        eliminado: true,
        online: true,
        google: true,
        isTechnician: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (userData.estado !== undefined || userData.eliminado !== undefined) {
      invalidateMembershipsCache()
    }
    return res.json(updatedUser)
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    return res.status(500).json({
      error: 'Hubo un error al actualizar el usuario.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const updateCompanyUser = async (req: Request, res: Response) => {
  const { id } = req.params
  const { password, roleId, membershipStatus, ...userData } = req.body

  try {
    if (!req.empresaId) {
      return res.status(400).json({ error: 'Empresa no especificada.' })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: String(id) },
    })

    if (!existingUser || existingUser.eliminado) {
      return res.status(404).json({
        error: 'Usuario no encontrado.',
      })
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_empresaId: {
          userId: String(id),
          empresaId: req.empresaId,
        },
      },
    })

    if (!existingMembership) {
      return res.status(404).json({
        error: 'El usuario no pertenece a la empresa activa.',
      })
    }

    if (roleId) {
      const role = await prisma.companyRole.findFirst({
        where: {
          id: String(roleId),
          empresaId: req.empresaId,
        },
      })

      if (!role) {
        return res.status(400).json({
          error: 'El rol no pertenece a la empresa activa.',
        })
      }
    }

    const data: Record<string, unknown> = { ...userData }

    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }

    if (userData.correo) {
      data.correo = String(userData.correo).trim().toLowerCase()
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: String(id) },
        data,
      })

      if (roleId || membershipStatus) {
        await tx.membership.update({
          where: { id: existingMembership.id },
          data: {
            ...(roleId ? { roleId: String(roleId) } : {}),
            ...(membershipStatus ? { status: membershipStatus } : {}),
            assignedBy: req.user?.userId || null,
          },
        })
      }

      return tx.user.findUnique({
        where: { id: String(id) },
        select: {
          id: true,
          img: true,
          nombre: true,
          correo: true,
          telefono: true,
          departamento: true,
          acceso: true,
          estado: true,
          eliminado: true,
          online: true,
          google: true,
          isTechnician: true,
          createdAt: true,
          updatedAt: true,
          memberships: {
            where: {
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
          },
        },
      })
    })

    invalidateMembershipsCache(req.empresaId)
    return res.json(updatedUser)
  } catch (error) {
    console.error('Error actualizando usuario de empresa:', error)
    return res.status(500).json({
      error: 'Hubo un error al actualizar el usuario de la empresa.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const saveFcmToken = async (req: Request, res: Response) => {
  const userId = req.user?.userId
  const { token } = req.body

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token FCM inválido.' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: String(userId) } })
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' })

    if (!user.fcmTokens.includes(token)) {
      await prisma.user.update({
        where: { id: String(userId) },
        data: { fcmTokens: { push: token } },
      })
    }

    return res.json({ ok: true })
  } catch (error) {
    console.error('Error guardando FCM token:', error)
    return res.status(500).json({ error: 'Error al guardar el token.' })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: String(id) },
    })

    if (!existingUser) {
      return res.status(404).json({
        error: 'Usuario no encontrado.',
      })
    }

    await prisma.user.update({
      where: { id: String(id) },
      data: { eliminado: true },
    })

    invalidateMembershipsCache()
    return res.status(204).send()
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    return res.status(500).json({
      error: 'Hubo un error al eliminar el usuario.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const deleteCompanyUser = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    if (!req.empresaId) {
      return res.status(400).json({ error: 'Empresa no especificada.' })
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_empresaId: {
          userId: String(id),
          empresaId: req.empresaId,
        },
      },
    })

    if (!existingMembership) {
      return res.status(404).json({
        error: 'El usuario no pertenece a la empresa activa.',
      })
    }

    await prisma.membership.delete({
      where: { id: existingMembership.id },
    })

    invalidateMembershipsCache(req.empresaId)
    return res.status(204).send()
  } catch (error) {
    console.error('Error removiendo usuario de empresa:', error)
    return res.status(500).json({
      error: 'Hubo un error al remover el usuario de la empresa.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}
