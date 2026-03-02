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
        // ===== BRANDS SCHEMAS =====
        BrandCreateRequest: {
          type: 'object',
          required: ['code', 'name', 'type'],
          properties: {
            code: {
              type: 'string',
              minLength: 2,
              maxLength: 20,
              pattern: '^[A-Z0-9-]+$',
              example: 'NK',
              description: 'Código de la marca (mayúsculas, números y guiones)',
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'Nike',
              description: 'Nombre de la marca',
            },
            type: {
              type: 'string',
              enum: ['VEHICLE', 'PART', 'BOTH'],
              example: 'BOTH',
              description:
                'Tipo de marca - VEHICLE (vehículos), PART (repuestos) o BOTH (ambos)',
            },
            description: {
              type: 'string',
              maxLength: 500,
              example: 'Marca de ropa deportiva',
              description: 'Descripción de la marca (opcional)',
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Estado activo de la marca',
            },
          },
        },
        BrandUpdateRequest: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              minLength: 2,
              maxLength: 20,
              pattern: '^[A-Z0-9-]+$',
              example: 'NK',
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'Nike',
            },
            type: {
              type: 'string',
              enum: ['VEHICLE', 'PART', 'BOTH'],
              example: 'BOTH',
            },
            description: {
              type: 'string',
              maxLength: 500,
            },
            isActive: {
              type: 'boolean',
            },
          },
        },
        BrandResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            code: {
              type: 'string',
              example: 'NK',
            },
            name: {
              type: 'string',
              example: 'Nike',
            },
            type: {
              type: 'string',
              enum: ['VEHICLE', 'PART', 'BOTH'],
            },
            description: {
              type: 'string',
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // ===== IMAGES SCHEMAS =====
        ImageCreateRequest: {
          type: 'object',
          required: ['itemId', 'url'],
          properties: {
            itemId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://cdn.example.com/images/product1.jpg',
            },
            altText: {
              type: 'string',
              example: 'Nike Air Max shoes',
            },
            isPrimary: {
              type: 'boolean',
              default: false,
            },
            displayOrder: {
              type: 'integer',
              default: 0,
            },
          },
        },
        ImageUpdateRequest: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              format: 'uri',
            },
            altText: {
              type: 'string',
            },
            displayOrder: {
              type: 'integer',
            },
          },
        },
        ImageResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            itemId: {
              type: 'string',
              format: 'uuid',
            },
            url: {
              type: 'string',
              format: 'uri',
            },
            altText: {
              type: 'string',
            },
            isPrimary: {
              type: 'boolean',
            },
            displayOrder: {
              type: 'integer',
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // ===== PRICING SCHEMAS =====
        PricingCreateRequest: {
          type: 'object',
          required: ['itemId', 'cost', 'salePrice'],
          properties: {
            itemId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            cost: {
              type: 'number',
              example: 50,
              description: 'Costo del artículo',
            },
            salePrice: {
              type: 'number',
              example: 100,
              description: 'Precio de venta',
            },
            currency: {
              type: 'string',
              default: 'USD',
              example: 'USD',
            },
            minPrice: {
              type: 'number',
              description: 'Precio mínimo permitido',
            },
            isActive: {
              type: 'boolean',
              default: true,
            },
          },
        },
        PricingUpdateRequest: {
          type: 'object',
          properties: {
            cost: {
              type: 'number',
            },
            salePrice: {
              type: 'number',
            },
            minPrice: {
              type: 'number',
            },
            isActive: {
              type: 'boolean',
            },
          },
        },
        PricingResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            itemId: {
              type: 'string',
              format: 'uuid',
            },
            cost: {
              type: 'number',
            },
            salePrice: {
              type: 'number',
            },
            currency: {
              type: 'string',
            },
            minPrice: {
              type: 'number',
            },
            margin: {
              type: 'number',
              description: 'Margen de ganancia en porcentaje',
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PricingTierCreateRequest: {
          type: 'object',
          required: ['pricingId', 'minQty', 'price'],
          properties: {
            pricingId: {
              type: 'string',
              format: 'uuid',
            },
            minQty: {
              type: 'integer',
              example: 10,
              description: 'Cantidad mínima',
            },
            price: {
              type: 'number',
              example: 95,
              description: 'Precio para este tier',
            },
            discount: {
              type: 'number',
              example: 5,
              description: 'Descuento en porcentaje',
            },
          },
        },
        // ===== BULK SCHEMAS =====
        BulkImportRequest: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
              },
              example: [
                { sku: 'ITEM001', name: 'Product 1', price: 100 },
                { sku: 'ITEM002', name: 'Product 2', price: 150 },
              ],
              description: 'Array de artículos a importar',
            },
            updateIfExists: {
              type: 'boolean',
              default: false,
              description: 'Actualizar si el artículo ya existe',
            },
          },
        },
        BulkExportRequest: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['csv', 'json', 'excel'],
              default: 'csv',
            },
            filters: {
              type: 'object',
              example: { category: 'shoes', isActive: true },
            },
            fields: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['sku', 'name', 'price', 'category'],
            },
          },
        },
        BulkUpdateRequest: {
          type: 'object',
          required: ['filters', 'updates'],
          properties: {
            filters: {
              type: 'object',
              example: { category: 'shoes' },
              description: 'Criterios de filtrado',
            },
            updates: {
              type: 'object',
              example: { price: 150, isActive: true },
              description: 'Campos a actualizar',
            },
          },
        },
        // ===== SEARCH SCHEMAS =====
        SearchRequest: {
          type: 'object',
          required: ['query'],
          properties: {
            query: {
              type: 'string',
              example: 'Nike',
              description: 'Término de búsqueda',
            },
            filters: {
              type: 'object',
              example: { category: 'shoes' },
            },
            page: {
              type: 'integer',
              default: 1,
            },
            limit: {
              type: 'integer',
              default: 20,
            },
          },
        },
        AdvancedSearchRequest: {
          type: 'object',
          required: ['filters'],
          properties: {
            query: {
              type: 'string',
              example: 'Nike shoes',
            },
            filters: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                },
                brand: {
                  type: 'string',
                },
                priceMin: {
                  type: 'number',
                },
                priceMax: {
                  type: 'number',
                },
              },
            },
            sortBy: {
              type: 'string',
              enum: ['name', 'price', 'relevance', 'newest'],
              default: 'relevance',
            },
            page: {
              type: 'integer',
              default: 1,
            },
            limit: {
              type: 'integer',
              default: 20,
            },
          },
        },
        // ===== PAGINATION SCHEMAS =====
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                },
                limit: {
                  type: 'integer',
                },
                total: {
                  type: 'integer',
                },
                totalPages: {
                  type: 'integer',
                },
              },
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

export const swaggerSpec = swaggerJsdoc(options) as Record<string, any>
console.log(
  `✅ Swagger spec generado con ${Object.keys(swaggerSpec.paths || {}).length} endpoints`
)
