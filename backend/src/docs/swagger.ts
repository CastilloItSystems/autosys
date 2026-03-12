import { Application } from 'express'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger.config.js'

export const setupSwagger = (app: Application) => {
  // Ruta para servir la documentación Swagger
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: false,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { font-size: 28px; }
    `,
      customSiteTitle: 'AutoSys API Documentation',
    })
  )

  // Ruta para obtener el spec en JSON (útil para Postman, insomnia, etc.)
  app.get('/api/docs/json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })

  // Ruta para obtener el spec en YAML (opcional)
  app.get('/api/docs/yaml', (_req, res) => {
    res.setHeader('Content-Type', 'text/yaml')
    res.send(JSON.stringify(swaggerSpec))
  })

  console.log('✅ Swagger Documentation initialized at /api/docs')
}
