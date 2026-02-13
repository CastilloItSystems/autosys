import swaggerJsdoc from 'swagger-jsdoc'
import path from 'path'
import { fileURLToPath } from 'url'

// Para obtener __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AutoSys API',
      version: '1.0.0',
      description:
        'Documentación oficial de la API AutoSys - Sistema de Gestión Integral',
      contact: {
        name: 'AutoSys Support',
        email: 'support@autosys.com',
      },
      license: {
        name: 'Proprietary',
        url: 'https://autosys.com/license',
      },
    },
    servers: [
      {
        url: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api`,
        description:
          process.env.NODE_ENV === 'production'
            ? 'Production Server'
            : 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT token for authentication. Include in Authorization header as: Bearer <token>',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'number',
              example: 400,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'number',
              example: 200,
            },
            message: {
              type: 'string',
              example: 'Success message',
            },
            data: {
              type: 'object',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  // Archivos a scanear para comentarios JSDoc
  apis: [
    path.resolve(__dirname, '../controllers/**/*.ts'),
    path.resolve(__dirname, '../routes/**/*.ts'),
    path.resolve(__dirname, '../features/**/*.routes.ts'),
    path.resolve(__dirname, '../features/**/*.controller.ts'),
  ],
}

// Debug: mostrar dónde está buscando
console.log('🔍 Swagger buscando archivos en:')
options.apis.forEach((apiPath) => {
  console.log(`   - ${apiPath}`)
})

export const swaggerSpec = swaggerJsdoc(options)
console.log(
  `✅ Swagger spec generado con ${Object.keys(swaggerSpec.paths || {}).length} endpoints`
)
