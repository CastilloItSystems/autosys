import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../services/prisma.service.js'
import { generateToken } from '../services/jwt.service.js'
import { resolvePermissionsFromBase } from '../shared/utils/resolvePermissions.js'
import { ApiResponse } from '../shared/utils/apiResponse.js'
import { logger } from '../shared/utils/logger.js'

export const login = async (req: Request, res: Response) => {
  try {
    const body = (req.validatedBody || req.body) as {
      correo?: string
      password?: string
    }

    const correo = body.correo?.trim().toLowerCase()
    const password = body.password

    if (!correo || !password) {
      return ApiResponse.badRequest(res, 'Correo y contraseña son requeridos')
    }

    const user = await prisma.user.findUnique({
      where: { correo },
      include: {
        userEmpresaRoles: {
          include: {
            empresa: { select: { id_empresa: true } },
            role: { select: { name: true, permissions: true } },
          },
        },
        userPermissions: {
          select: { permission: true, action: true },
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

    const basePermissions = user.userEmpresaRoles.flatMap(
      (uer) => uer.role.permissions
    )
    const permissions = resolvePermissionsFromBase(
      basePermissions,
      user.userPermissions
    )

    const isSuperAdmin = user.userEmpresaRoles.some(
      (uer) => uer.role.name === 'SUPER_ADMIN'
    )

    const jwtRole = isSuperAdmin
      ? 'SUPER_ADMIN'
      : (user.userEmpresaRoles[0]?.role.name ?? user.rol)

    const empresaIds = user.userEmpresaRoles.map(
      (uer) => uer.empresa.id_empresa
    )
    const activeEmpresaId = empresaIds[0]

    const tokenPayload = {
      userId: user.id,
      email: user.correo,
      role: jwtRole,
      access: user.acceso,
      permissions,
      empresaIds,
      ...(activeEmpresaId ? { activeEmpresaId } : {}),
    }

    const token = generateToken(tokenPayload)

    const {
      password: _password,
      userPermissions: _userPermissions,
      userEmpresaRoles: _userEmpresaRoles,
      ...userWithoutSensitive
    } = user

    return ApiResponse.success(
      res,
      {
        token,
        user: {
          ...userWithoutSensitive,
          empresaIds,
          activeEmpresaId,
        },
      },
      'Login exitoso'
    )
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error en login', { message: err.message, stack: err.stack })
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
      departamento?: string
      rol?: string
      acceso?: string
    }

    const nombre = body.nombre?.trim()
    const correo = body.correo?.trim().toLowerCase()
    const password = body.password
    const telefono = body.telefono
    const departamento = body.departamento?.trim()
    const rol = body.rol
    const acceso = body.acceso

    if (!nombre || !correo || !password || !departamento) {
      return ApiResponse.badRequest(
        res,
        'Nombre, correo, contraseña y departamento son requeridos'
      )
    }

    // Convertir departamento a array (acepta string o array)
    const departamentoInput = Array.isArray(body.departamento)
      ? body.departamento
      : body.departamento
        ? [body.departamento.trim()]
        : []

    const existingUser = await prisma.user.findUnique({ where: { correo } })
    if (existingUser) {
      return ApiResponse.conflict(res, 'El correo ya está registrado')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        nombre,
        correo,
        password: hashedPassword,
        telefono,
        departamento: departamentoInput,
        rol: rol || 'VIEWER',
        acceso: acceso || 'ninguno',
      },
    })

    // Nota: si prefieres no emitir token hasta asignar empresa/roles, quítalo aquí.
    const token = generateToken({
      userId: newUser.id,
      email: newUser.correo,
      role: newUser.rol,
      access: newUser.acceso,
      permissions: [],
      empresaIds: [],
    })

    const { password: _password, ...userWithoutPassword } = newUser

    return ApiResponse.created(
      res,
      {
        token,
        user: userWithoutPassword,
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
      return ApiResponse.notFound(res, 'Usuario no encontrado')
    }

    const basePermissions = user.userEmpresaRoles.flatMap(
      (uer) => uer.role.permissions
    )
    const effectivePermissions = resolvePermissionsFromBase(
      basePermissions,
      user.userPermissions
    )

    const { password: _password, ...userWithoutPassword } = user

    return ApiResponse.success(
      res,
      {
        ...userWithoutPassword,
        effectivePermissions,
      },
      'Perfil obtenido exitosamente'
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
