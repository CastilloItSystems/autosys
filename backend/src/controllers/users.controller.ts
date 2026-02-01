import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../services/prisma.service.js'

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        eliminado: false,
      },
    })

    res.json({
      total: users.length,
      users,
    })
  } catch (error) {
    res.status(500).json({ error: 'Hubo un error al obtener los usuarios.' })
  }
}

export const createUser = async (req: Request, res: Response) => {
  try {
    const { password, ...userData } = req.body

    if (!password) {
      return res.status(400).json({ error: 'La contraseña es obligatoria.' })
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    const newUser = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    })

    res.status(201).json(newUser)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Hubo un error al crear el usuario.' })
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
  const { password, ...userData } = req.body
  try {
    if (password) {
      const salt = bcrypt.genSaltSync(10)
      userData.password = bcrypt.hashSync(password, salt)
    }

    const updatedUser = await prisma.user.update({
      where: { id: String(id) },
      data: userData,
    })
    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ error: 'Hubo un error al actualizar el usuario.' })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await prisma.user.update({
      where: { id: String(id) },
      data: { eliminado: true },
    })
    res.status(204).send() // No Content
  } catch (error) {
    res.status(500).json({ error: 'Hubo un error al eliminar el usuario.' })
  }
}
