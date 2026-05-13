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

const extractEmpresaFromParam = jest.fn((req: any, _res: any, next: any) => {
  req.empresaId = req.params.id
  next()
})

await jest.unstable_mockModule('../controllers/empresas.controller.js', () => ({
  getAllEmpresas: handler('getAllEmpresas'),
  getMyEmpresas: handler('getMyEmpresas'),
  createEmpresa: handler('createEmpresa'),
  getEmpresaById: handler('getEmpresaById'),
  updateEmpresa: handler('updateEmpresa'),
  deleteEmpresa: handler('deleteEmpresa'),
  getEmpresaPredeterminada: handler('getEmpresaPredeterminada'),
  getAuditLogsForEmpresa: handler('getAuditLogsForEmpresa'),
  seedDefaultsForEmpresa: handler('seedDefaultsForEmpresa'),
  uploadLogo: handler('uploadLogo'),
}))

await jest.unstable_mockModule(
  '../shared/middleware/authorize.middleware.js',
  () => ({ authorize, authorizeInAnyEmpresa })
)

await jest.unstable_mockModule(
  '../shared/middleware/empresa.middleware.js',
  () => ({ extractEmpresaFromParam })
)

await jest.unstable_mockModule('../shared/utils/fileUpload.js', () => ({
  FileUploadHelper: {
    createMemoryUploader: () => (_req: any, _res: any, next: any) => next(),
  },
}))

const { default: empresaRoutes } = await import('./empresas.routes.js')

const app = express()
app.use(express.json())
app.use('/empresas', empresaRoutes)

describe('empresas.routes', () => {
  test('lista empresas globales con companies.view en cualquier empresa', async () => {
    await expect(request(app).get('/empresas')).resolves.toMatchObject({
      status: 200,
      body: {
        handler: 'getAllEmpresas',
        anyAuthz: [PERMISSIONS.COMPANIES_VIEW],
      },
    })
  })

  test('permite /empresas/my sin exigir companies.view', async () => {
    await expect(request(app).get('/empresas/my')).resolves.toMatchObject({
      status: 200,
      body: {
        handler: 'getMyEmpresas',
        authz: null,
        anyAuthz: null,
        empresaId: null,
      },
    })
  })

  test('protege detalle de empresa con companies.view en la empresa objetivo', async () => {
    await expect(request(app).get('/empresas/empresa-1')).resolves.toMatchObject({
      status: 200,
      body: {
        handler: 'getEmpresaById',
        authz: [PERMISSIONS.COMPANIES_VIEW],
        empresaId: 'empresa-1',
      },
    })
  })
})
