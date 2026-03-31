import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../services/prisma.service.js'
import r2StorageService from '../services/r2-storage.service.js'

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
        createdAt: true,
        updatedAt: true,
      },
    })

    return res.json(updatedUser)
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    return res.status(500).json({
      error: 'Hubo un error al actualizar el usuario.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
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

    return res.status(204).send()
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    return res.status(500).json({
      error: 'Hubo un error al eliminar el usuario.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}
