import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../services/prisma.service.js'
import { generateToken } from '../services/jwt.service.js'
import { resolvePermissionsFromBase } from '../shared/utils/resolvePermissions.js'

export const login = async (req: Request, res: Response) => {
  try {
    const { correo, password } = req.validatedBody || req.body

    if (!correo || !password) {
      return res
        .status(400)
        .json({ error: 'Correo y contraseña son requeridos' })
    }

    // Buscar usuario incluyendo roles dinámicos por empresa y overrides individuales
    const user = await prisma.user.findUnique({
      where: { correo },
      include: {
        userEmpresaRoles: {
          include: {
            role: {
              select: { name: true, permissions: true },
            },
          },
        },
        userPermissions: {
          select: { permission: true, action: true },
        },
      },
    })

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    if (user.eliminado) {
      return res.status(401).json({ error: 'Usuario inactivo' })
    }

    if (user.estado !== 'activo') {
      return res.status(401).json({ error: 'Usuario inactivo o pendiente de activación' })
    }

    const isValidPassword = bcrypt.compareSync(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // Resolver permisos: unión de permissions[] de todos los roles del usuario + overrides individuales
    const basePermissions = user.userEmpresaRoles.flatMap((uer) => uer.role.permissions)
    const permissions = resolvePermissionsFromBase(basePermissions, user.userPermissions)

    // Determinar el role field del JWT (SUPER_ADMIN tiene acceso total)
    const isSuperAdmin = user.userEmpresaRoles.some((uer) => uer.role.name === 'SUPER_ADMIN')
    const jwtRole = isSuperAdmin
      ? 'SUPER_ADMIN'
      : (user.userEmpresaRoles[0]?.role.name ?? user.rol) // fallback al campo legacy

    const token = generateToken({
      userId: user.id,
      email: user.correo,
      role: jwtRole,
      access: user.acceso,
      permissions,
    })

    // Remover campos sensibles del response
    const { password: _, userPermissions, userEmpresaRoles, ...userWithoutPassword } = user

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

    const existingUser = await prisma.user.findUnique({
      where: { correo },
    })

    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está registrado' })
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    // Crear usuario (sin empresa ni rol asignado aún — el admin lo asigna después)
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

    // Usuario recién creado no tiene empresa ni rol dinámico aún → permisos vacíos
    const token = generateToken({
      userId: newUser.id,
      email: newUser.correo,
      role: newUser.rol,
      access: newUser.acceso,
      permissions: [],
    })

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
        userEmpresaRoles: {
          include: {
            empresa: { select: { id_empresa: true, nombre: true } },
            role: { select: { id: true, name: true, permissions: true } },
          },
        },
        userPermissions: {
          select: { permission: true, action: true, reason: true },
        },
      },
    })

    if (!user || user.eliminado) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const basePermissions = user.userEmpresaRoles.flatMap((uer) => uer.role.permissions)
    const effectivePermissions = resolvePermissionsFromBase(basePermissions, user.userPermissions)

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

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    })

    if (!user || user.eliminado) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const isValidCurrentPassword = bcrypt.compareSync(currentPassword, user.password)
    if (!isValidCurrentPassword) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' })
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt)

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
