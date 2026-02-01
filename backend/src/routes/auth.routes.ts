import { Router } from 'express'
import {
  login,
  register,
  getProfile,
  logout,
  changePassword,
} from '../controllers/auth.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

// Rutas públicas
router.post('/login', login)
router.post('/register', register)

// Rutas protegidas
router.get('/profile', authenticateToken, getProfile)
router.post('/logout', authenticateToken, logout)
router.post('/change-password', authenticateToken, changePassword)

export default router
