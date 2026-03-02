import { PrismaClient } from '../generated/prisma/client'
import prisma from './prisma.service'

/**
 * Crea una instancia de Prisma extendida que auto-inyecta empresaId
 * en todas las queries de los modelos ancla (Brand, Category, Unit, Model,
 * Warehouse, Item, Supplier, Customer, Order, PreInvoice, Invoice)
 *
 * Esto permite que cada request tenga su propio contexto de tenant
 * sin modificar ningún service existente.
 */
export function createTenantPrisma(empresaId: string) {
  // Modelos ancla que requieren empresaId (10 modelos)
  const tenantModels = [
    'brand',
    'category',
    'unit',
    'model',
    'warehouse',
    'item',
    'supplier',
    'customer',
    'order',
    'preInvoice',
    'invoice',
  ]

  return prisma.$extends({
    query: {
      // Para cada modelo, interceptar los query methods
      $allModels: {
        // findMany: inyectar empresaId en where
        async findMany({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            if (!args.where) {
              args.where = {}
            }
            // Merge empresaId con el where existente
            args.where = {
              AND: [args.where, { empresaId }],
            }
          }
          return query(args)
        },

        // findUnique: inyectar empresaId en where
        async findUnique({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            if (!args.where) {
              args.where = {}
            }
            args.where = {
              AND: [args.where, { empresaId }],
            }
          }
          return query(args)
        },

        // findFirst: inyectar empresaId en where
        async findFirst({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            if (!args.where) {
              args.where = {}
            }
            args.where = {
              AND: [args.where, { empresaId }],
            }
          }
          return query(args)
        },

        // count: inyectar empresaId en where
        async count({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            if (!args.where) {
              args.where = {}
            }
            args.where = {
              AND: [args.where, { empresaId }],
            }
          }
          return query(args)
        },

        // aggregate: inyectar empresaId en where
        async aggregate({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            if (!args.where) {
              args.where = {}
            }
            args.where = {
              AND: [args.where, { empresaId }],
            }
          }
          return query(args)
        },

        // groupBy: inyectar empresaId en where
        async groupBy({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            if (!args.where) {
              args.where = {}
            }
            args.where = {
              AND: [args.where, { empresaId }],
            }
          }
          return query(args)
        },

        // create: inyectar empresaId en data
        async create({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            args.data.empresaId = empresaId
          }
          return query(args)
        },

        // createMany: inyectar empresaId en cada data
        async createMany({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({
                ...item,
                empresaId,
              }))
            }
          }
          return query(args)
        },

        // update: inyectar empresaId en where
        async update({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            if (!args.where) {
              args.where = {}
            }
            args.where = {
              AND: [args.where, { empresaId }],
            }
          }
          return query(args)
        },

        // updateMany: inyectar empresaId en where
        async updateMany({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            if (!args.where) {
              args.where = {}
            }
            args.where = {
              AND: [args.where, { empresaId }],
            }
          }
          return query(args)
        },

        // delete: inyectar empresaId en where
        async delete({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            if (!args.where) {
              args.where = {}
            }
            args.where = {
              AND: [args.where, { empresaId }],
            }
          }
          return query(args)
        },

        // deleteMany: inyectar empresaId en where
        async deleteMany({ args, query }: any) {
          if (tenantModels.includes(this.$name)) {
            if (!args.where) {
              args.where = {}
            }
            args.where = {
              AND: [args.where, { empresaId }],
            }
          }
          return query(args)
        },
      },
    },
  })
}

export default createTenantPrisma
