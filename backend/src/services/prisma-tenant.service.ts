import prisma from './prisma.service.js'

const tenantModels = new Set([
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
])

const addEmpresaFilter = (args: any, empresaId: string) => {
  if (!args.where) args.where = {}
  args.where = { AND: [args.where, { empresaId }] }
}

/**
 * Crea una instancia de Prisma extendida que auto-inyecta empresaId
 * en todas las queries de los modelos ancla.
 *
 * Nota: findUnique/update/delete no se protegen con AND porque esperan
 * WhereUniqueInput. Para esos métodos, valida empresaId antes en el servicio.
 */
export function createTenantPrisma(
  empresaId: string
): ReturnType<typeof prisma.$extends> {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }: any) {
          if (tenantModels.has(model)) addEmpresaFilter(args, empresaId)
          return query(args)
        },

        async findFirst({ model, args, query }: any) {
          if (tenantModels.has(model)) addEmpresaFilter(args, empresaId)
          return query(args)
        },

        async count({ model, args, query }: any) {
          if (tenantModels.has(model)) addEmpresaFilter(args, empresaId)
          return query(args)
        },

        async aggregate({ model, args, query }: any) {
          if (tenantModels.has(model)) addEmpresaFilter(args, empresaId)
          return query(args)
        },

        async groupBy({ model, args, query }: any) {
          if (tenantModels.has(model)) addEmpresaFilter(args, empresaId)
          return query(args)
        },

        async create({ model, args, query }: any) {
          if (tenantModels.has(model)) {
            args.data = { ...args.data, empresaId }
          }
          return query(args)
        },

        // async createMany({ model, args, query }: any) {
        //   if (tenantModels.has(model) && Array.isArray(args.data)) {
        //     args.data = args.data.map((item: any) => ({ ...item, empresaId }))
        //   }
        //   return query(args)
        // },
        async createMany({ model, args, query }: any) {
          if (tenantModels.has(model)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({ ...item, empresaId }))
            } else if (args.data && typeof args.data === 'object') {
              args.data = { ...args.data, empresaId }
            }
          }
          return query(args)
        },

        // findUnique no se toca (espera WhereUniqueInput)
        async findUnique({ args, query }: any) {
          return query(args)
        },

        // update/delete por unique tampoco se tocan
        async update({ args, query }: any) {
          return query(args)
        },

        async delete({ args, query }: any) {
          return query(args)
        },

        // updateMany/deleteMany sí se pueden filtrar
        async updateMany({ model, args, query }: any) {
          if (tenantModels.has(model)) addEmpresaFilter(args, empresaId)
          return query(args)
        },

        async deleteMany({ model, args, query }: any) {
          if (tenantModels.has(model)) addEmpresaFilter(args, empresaId)
          return query(args)
        },
      },
    },
  })
}

export default createTenantPrisma
