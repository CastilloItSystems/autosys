// Re-export prisma from services for compatibility
import prismaDefault from '../services/prisma.service.js'
export const prisma = prismaDefault
export default prismaDefault
