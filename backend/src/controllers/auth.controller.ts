import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../services/prisma.service.js'
import { generateToken } from '../services/jwt.service.js'
import { resolvePermissions } from '../shared/utils/resolvePermissions.js'

export const login = async (req: Request, res: Response) => {
  try {
    const { correo, password } = req.validatedBody || req.body

    if (!correo || !password) {
      return res
        .status(400)
        .json({ error: 'Correo y contraseña son requeridos' })
    }

    // Buscar usuario por correo incluyendo overrides de permisos
    const user = await prisma.user.findUnique({
      where: { correo },
      include: {
        empresas: true,
        userPermissions: {
          select: { permission: true, action: true },
        },
      },
    })

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // Verificar si el usuario está eliminado
    if (user.eliminado) {
      return res.status(401).json({ error: 'Usuario inactivo' })
    }

    // Verificar estado
    if (user.estado !== 'activo') {
      return res.status(401).json({ error: 'Usuario inactivo o pendiente de activación' })
    }

    // Verificar contraseña
    const isValidPassword = bcrypt.compareSync(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // Resolver permisos efectivos: rol base + overrides individuales
    const permissions = resolvePermissions(user.rol, user.userPermissions)

    // Generar token JWT con permisos incluidos
    const token = generateToken({
      userId: user.id,
      email: user.correo,
      role: user.rol,
      access: user.acceso,
      permissions,
    })

    // Remover password y tokens sensibles del response
    const { password: _, userPermissions, ...userWithoutPassword } = user

    res.json({
      message: 'Login exitoso',
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const register = async (req: Request, res: Response) => {
  try {
    const { nombre, correo, password, telefono, departamento, rol, acceso } =
      req.validatedBody || req.body

    if (!nombre || !correo || !password || !departamento) {
      return res.status(400).json({
        error: 'Nombre, correo, contraseña y departamento son requeridos',
      })
    }

    // Verificar si el correo ya existe
    const existingUser = await prisma.user.findUnique({
      where: { correo },
    })

    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está registrado' })
    }

    // Hash de la contraseña
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    // Crear usuario (sin permisos individuales aún)
    const newUser = await prisma.user.create({
      data: {
        nombre,
        correo,
        password: hashedPassword,
        telefono,
        departamento,
        rol: rol || 'VIEWER',
        acceso: acceso || 'ninguno',
      },
    })

    // Permisos base del rol (sin overrides porque recién se creó)
    const permissions = resolvePermissions(newUser.rol, [])

    // Generar token JWT
    const token = generateToken({
      userId: newUser.id,
      email: newUser.correo,
      role: newUser.rol,
      access: newUser.acceso,
      permissions,
    })

    // Remover password del response
    const { password: _, ...userWithoutPassword } = newUser

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        userPermissions: {
          select: { permission: true, action: true, reason: true },
        },
      },
    })

    if (!user || user.eliminado) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Incluir permisos efectivos en el perfil
    const effectivePermissions = resolvePermissions(user.rol, user.userPermissions)

    const { password, ...userWithoutPassword } = user

    res.json({
      ...userWithoutPassword,
      effectivePermissions,
    })
  } catch (error) {
    console.error('Error obteniendo perfil:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const logout = async (req: Request, res: Response) => {
  // En una implementación real, aquí podrías invalidar el token
  // agregándolo a una lista negra en Redis o base de datos
  res.json({ message: 'Logout exitoso' })
}

export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Contraseña actual y nueva son requeridas' })
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' })
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    })

    if (!user || user.eliminado) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Verificar contraseña actual
    const isValidCurrentPassword = bcrypt.compareSync(
      currentPassword,
      user.password
    )
    if (!isValidCurrentPassword) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' })
    }

    // Hash de la nueva contraseña
    const salt = bcrypt.genSaltSync(10)
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt)

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedNewPassword },
    })

    res.json({ message: 'Contraseña cambiada exitosamente' })
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
