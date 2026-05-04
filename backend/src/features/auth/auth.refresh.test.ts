import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import bcrypt from 'bcryptjs'
import request from 'supertest'
import app from '../../app.js'
import prisma from '../../services/prisma.service.js'

const testEmail = 'refresh-token@test.com'
const testPassword = 'Password123'

const login = () =>
  request(app).post('/api/auth/login').send({
    correo: testEmail,
    password: testPassword,
  })

describe('Auth refresh tokens', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { correo: testEmail } }).catch(() => {})
    await prisma.user.create({
      data: {
        nombre: 'Refresh Token Test',
        correo: testEmail,
        password: await bcrypt.hash(testPassword, 10),
        departamento: ['qa'],
        acceso: 'completo',
        estado: 'activo',
        eliminado: false,
      },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { correo: testEmail } }).catch(() => {})
  })

  test('login devuelve access token corto y refresh token', async () => {
    const res = await login()

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.data.accessToken).toBe('string')
    expect(typeof res.body.data.accessTokenExpiresAt).toBe('string')
    expect(typeof res.body.data.refreshToken).toBe('string')
    expect(typeof res.body.data.refreshTokenExpiresAt).toBe('string')
    expect(res.body.data.token).toBe(res.body.data.accessToken)
  })

  test('refresh rota el token y bloquea reutilización', async () => {
    const loginRes = await login()
    const firstRefreshToken = loginRes.body.data.refreshToken

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken })

    expect(refreshRes.status).toBe(200)
    expect(refreshRes.body.success).toBe(true)
    expect(refreshRes.body.data.refreshToken).not.toBe(firstRefreshToken)
    expect(typeof refreshRes.body.data.accessToken).toBe('string')

    const reuseRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken })

    expect(reuseRes.status).toBe(401)

    const familyRevokedRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshRes.body.data.refreshToken })

    expect(familyRevokedRes.status).toBe(401)
  })

  test('refresh vencido falla', async () => {
    const loginRes = await login()
    const refreshToken = loginRes.body.data.refreshToken

    const latestToken = await prisma.refreshToken.findFirst({
      where: { user: { correo: testEmail }, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    expect(latestToken).toBeTruthy()

    await prisma.refreshToken.update({
      where: { id: latestToken!.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(401)
  })

  test('logout revoca el refresh token activo', async () => {
    const loginRes = await login()
    const { accessToken, refreshToken } = loginRes.body.data

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })

    expect(logoutRes.status).toBe(200)

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })

    expect(refreshRes.status).toBe(401)
  })
})
