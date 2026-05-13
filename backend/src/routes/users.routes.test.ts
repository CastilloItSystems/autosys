import express from 'express'
import request from 'supertest'
import { describe, expect, jest, test } from '@jest/globals'
import { PERMISSIONS } from '../shared/constants/permissions.js'

const handler = (name: string) => (req: any, res: any) =>
  res.json({
    handler: name,
    authz: req.authz ?? null,
    anyAuthz: req.anyAuthz ?? null,
    empresaId: req.empresaId ?? null,
  })

const authenticate = jest.fn((req: any, _res: any, next: any) => {
  req.user = { userId: 'current-user' }
  next()
})

const authorize = jest.fn((...permissions: string[]) => {
  return (req: any, _res: any, next: any) => {
    req.authz = permissions
    next()
  }
})

const authorizeInAnyEmpresa = jest.fn((...permissions: string[]) => {
  return (req: any, _res: any, next: any) => {
    req.anyAuthz = permissions
    next()
  }
})

const extractEmpresa = jest.fn((req: any, _res: any, next: any) => {
  req.empresaId = 'empresa-1'
  next()
})

await jest.unstable_mockModule('../controllers/users.controller.js', () => ({
  getAllUsers: handler('getAllUsers'),
  getCompanyUsers: handler('getCompanyUsers'),
  createUser: handler('createUser'),
  createCompanyUser: handler('createCompanyUser'),
  getUserById: handler('getUserById'),
  updateUser: handler('updateUser'),
  updateCompanyUser: handler('updateCompanyUser'),
  deleteUser: handler('deleteUser'),
  deleteCompanyUser: handler('deleteCompanyUser'),
  uploadProfilePicture: handler('uploadProfilePicture'),
  saveFcmToken: handler('saveFcmToken'),
}))

await jest.unstable_mockModule(
  '../shared/middleware/authenticate.middleware.js',
  () => ({ authenticate })
)

await jest.unstable_mockModule(
  '../shared/middleware/authorize.middleware.js',
  () => ({ authorize, authorizeInAnyEmpresa })
)

await jest.unstable_mockModule(
  '../shared/middleware/empresa.middleware.js',
  () => ({ extractEmpresa })
)

await jest.unstable_mockModule('../shared/utils/fileUpload.js', () => ({
  FileUploadHelper: {
    createMemoryUploader: () => (_req: any, _res: any, next: any) => next(),
  },
}))

const { default: userRoutes } = await import('./users.routes.js')

const app = express()
app.use(express.json())
app.use('/users', userRoutes)

describe('users.routes', () => {
  test('protege usuarios de empresa con users.* y empresa activa', async () => {
    await expect(request(app).get('/users/company')).resolves.toMatchObject({
      status: 200,
      body: {
        handler: 'getCompanyUsers',
        authz: [PERMISSIONS.USERS_VIEW],
        empresaId: 'empresa-1',
      },
    })

    await expect(request(app).post('/users/company')).resolves.toMatchObject({
      status: 200,
      body: {
        handler: 'createCompanyUser',
        authz: [PERMISSIONS.USERS_CREATE],
        empresaId: 'empresa-1',
      },
    })

    await expect(request(app).put('/users/company/other-user')).resolves.toMatchObject({
      status: 200,
      body: {
        handler: 'updateCompanyUser',
        authz: [PERMISSIONS.USERS_UPDATE],
        empresaId: 'empresa-1',
      },
    })
  })

  test('protege usuarios globales con platform_users.* en cualquier empresa', async () => {
    await expect(request(app).get('/users')).resolves.toMatchObject({
      status: 200,
      body: {
        handler: 'getAllUsers',
        anyAuthz: [PERMISSIONS.PLATFORM_USERS_VIEW],
      },
    })

    await expect(request(app).post('/users')).resolves.toMatchObject({
      status: 200,
      body: {
        handler: 'createUser',
        anyAuthz: [PERMISSIONS.PLATFORM_USERS_CREATE],
      },
    })

    await expect(request(app).delete('/users/other-user')).resolves.toMatchObject({
      status: 200,
      body: {
        handler: 'deleteUser',
        anyAuthz: [PERMISSIONS.PLATFORM_USERS_DELETE],
      },
    })
  })

  test('permite perfil propio sin permiso platform_users.update', async () => {
    await expect(request(app).put('/users/current-user')).resolves.toMatchObject({
      status: 200,
      body: {
        handler: 'updateUser',
        anyAuthz: null,
      },
    })
  })
})
