import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../services/prisma.service.js'
import { generateToken } from '../services/jwt.service.js'
import { resolveMembershipPermissions } from '../shared/utils/resolvePermissions.js'
import { ApiResponse } from '../shared/utils/apiResponse.js'
import { logger } from '../shared/utils/logger.js'

export const login = async (req: Request, res: Response) => {
  try {
    const body = (req.validatedBody || req.body) as {
      correo?: string
      password?: string
    }

    const correo = (body.correo ?? (body as any).email)?.trim().toLowerCase()
    const password = body.password ?? (body as any).password

    if (!correo || !password) {
      return ApiResponse.badRequest(res, 'Correo y contraseña son requeridos')
    }

    const user = await prisma.user.findUnique({
      where: { correo },
      include: {
        memberships: {
          include: {
            empresa: {
              select: {
                id_empresa: true,
                nombre: true,
              },
            },
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      select: {
                        code: true,
                        description: true,
                      },
                    },
                  },
                },
              },
            },
            permissions: {
              include: {
                permission: {
                  select: {
                    code: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return ApiResponse.unauthorized(res, 'Credenciales inválidas')
    }

    if (user.eliminado || user.estado !== 'activo') {
      return ApiResponse.unauthorized(
        res,
        'Usuario inactivo o pendiente de activación'
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return ApiResponse.unauthorized(res, 'Credenciales inválidas')
    }

    const activeMemberships = user.memberships.filter(
      (membership) => membership.status === 'active'
    )

    const empresas = activeMemberships.map((membership) => ({
      membershipId: membership.id,
      empresaId: membership.empresa.id_empresa,
      nombre: membership.empresa.nombre,
      role: {
        id: membership.role.id,
        name: membership.role.name,
        description: membership.role.description,
      },
      permissions: resolveMembershipPermissions(
        membership.role.permissions,
        membership.permissions
      ),
    }))

    const token = generateToken({
      userId: user.id,
      email: user.correo,
    })

    const { password: _password, ...userWithoutSensitive } = user
    const userResponse = {
      id: user.id,
      img: user.img,
      nombre: user.nombre,
      correo: user.correo,
      telefono: user.telefono,
      departamento: user.departamento,
      acceso: user.acceso,
      estado: user.estado,
      eliminado: user.eliminado,
      online: user.online,
      fcmTokens: user.fcmTokens,
      google: user.google,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
    return ApiResponse.success(
      res,
      {
        token,
        user: {
          ...userResponse,
          empresas,
        },
      },
      'Login exitoso'
    )
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error en login', {
      message: err.message,
      stack: err.stack,
    })
    return ApiResponse.serverError(res, 'Error interno del servidor')
  }
}

export const register = async (req: Request, res: Response) => {
  try {
    const body = (req.validatedBody || req.body) as {
      nombre?: string
      correo?: string
      password?: string
      telefono?: string
      departamento?: string | string[]
      acceso?: string
    }

    const nombre = body.nombre?.trim()
    const correo = body.correo?.trim().toLowerCase()
    const password = body.password
    const telefono = body.telefono
    const acceso = body.acceso

    const departamentoInput = Array.isArray(body.departamento)
      ? body.departamento.map((d) => d.trim()).filter(Boolean)
      : body.departamento
        ? [body.departamento.trim()]
        : []

    if (!nombre || !correo || !password || departamentoInput.length === 0) {
      return ApiResponse.badRequest(
        res,
        'Nombre, correo, contraseña y departamento son requeridos'
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { correo },
    })

    if (existingUser) {
      return ApiResponse.conflict(res, 'El correo ya está registrado')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        nombre,
        correo,
        password: hashedPassword,
        telefono: telefono || null,
        departamento: departamentoInput,
        acceso: (acceso as any) || 'ninguno',
      },
    })

    const token = generateToken({
      userId: newUser.id,
      email: newUser.correo,
    })

    const { password: _password, ...userWithoutPassword } = newUser

    return ApiResponse.created(
      res,
      {
        token,
        user: {
          ...userWithoutPassword,
          empresas: [],
        },
      },
      'Usuario registrado exitosamente'
    )
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error en registro', {
      message: err.message,
      stack: err.stack,
    })
    return ApiResponse.serverError(res, 'Error interno del servidor')
  }
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Usuario no autenticado')
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        memberships: {
          include: {
            empresa: {
              select: {
                id_empresa: true,
                nombre: true,
              },
            },
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      select: {
                        code: true,
                        description: true,
                      },
                    },
                  },
                },
              },
            },
            permissions: {
              include: {
                permission: {
                  select: {
                    code: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user || user.eliminado) {
      return ApiResponse.notFound(res, 'Usuario no encontrado')
    }

    const empresas = user.memberships.map((membership) => ({
      membershipId: membership.id,
      status: membership.status,
      assignedAt: membership.assignedAt,
      empresa: membership.empresa,
      role: {
        id: membership.role.id,
        name: membership.role.name,
        description: membership.role.description,
      },
      permissions: resolveMembershipPermissions(
        membership.role.permissions,
        membership.permissions
      ),
    }))

    const { password: _password, ...userWithoutPassword } = user
    const userResponse = {
      id: user.id,
      img: user.img,
      nombre: user.nombre,
      correo: user.correo,
      telefono: user.telefono,
      departamento: user.departamento,
      acceso: user.acceso,
      estado: user.estado,
      eliminado: user.eliminado,
      online: user.online,
      fcmTokens: user.fcmTokens,
      google: user.google,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
    return ApiResponse.success(
      res,
      {
        ...userResponse,
        empresas,
      },
      'Perfil obtenido exitosamente esta funcionando? '
    )
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error obteniendo perfil', {
      message: err.message,
      stack: err.stack,
    })
    return ApiResponse.serverError(res, 'Error interno del servidor')
  }
}

export const logout = async (_req: Request, res: Response) => {
  return ApiResponse.success(res, null, 'Logout exitoso')
}

export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Usuario no autenticado')
    }

    const body = (req.validatedBody || req.body) as {
      currentPassword?: string
      newPassword?: string
    }

    const currentPassword = body.currentPassword
    const newPassword = body.newPassword

    if (!currentPassword || !newPassword) {
      return ApiResponse.badRequest(
        res,
        'Contraseña actual y nueva son requeridas'
      )
    }

    if (newPassword.length < 6) {
      return ApiResponse.badRequest(
        res,
        'La nueva contraseña debe tener al menos 6 caracteres'
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    })

    if (!user || user.eliminado) {
      return ApiResponse.notFound(res, 'Usuario no encontrado')
    }

    const isValidCurrentPassword = await bcrypt.compare(
      currentPassword,
      user.password
    )

    if (!isValidCurrentPassword) {
      return ApiResponse.badRequest(res, 'Contraseña actual incorrecta')
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedNewPassword },
    })

    return ApiResponse.success(res, null, 'Contraseña cambiada exitosamente')
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error cambiando contraseña', {
      message: err.message,
      stack: err.stack,
    })
    return ApiResponse.serverError(res, 'Error interno del servidor')
  }
}
