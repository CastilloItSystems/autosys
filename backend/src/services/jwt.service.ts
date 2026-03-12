import jwt from 'jsonwebtoken'
import type { StringValue } from 'ms'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '7d') as StringValue

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export const generateToken = (
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export const extractTokenFromHeader = (
  authHeader: string | undefined
): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.slice(7).trim() || null
}
